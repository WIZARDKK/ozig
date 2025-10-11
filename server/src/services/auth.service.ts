import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name: string;
    role: {
      name: string;
      permissions: string[];
    };
  };
  token?: string;
  error?: string;
}

export class AuthService {
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      // Find user with role
      const user = await prisma.user.findUnique({
        where: { email: loginData.email },
        include: { role: true }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is deactivated. Please contact manager.'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        config.jwtSecret as string,
        { expiresIn: '24h' }
      );

      // Parse permissions
      const permissions = JSON.parse(user.role.permissions);

      // Log successful login
      await this.logUserActivity(user.id, 'LOGIN', 'Successful login');

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: {
            name: user.role.name,
            permissions: permissions
          }
        },
        token
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  async validateToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true }
      });

      if (!user || !user.isActive) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: {
          name: user.role.name,
          permissions: JSON.parse(user.role.permissions)
        }
      };
    } catch (error) {
      return null;
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Log password change
      await this.logUserActivity(userId, 'PASSWORD_CHANGE', 'Password changed successfully');

      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: 'Failed to change password' };
    }
  }

  private async logUserActivity(userId: number, action: string, details: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity: 'USER',
          entityId: userId,
          newData: { details },
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
    }
  }
}