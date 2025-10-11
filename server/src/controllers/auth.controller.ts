import { Request, Response } from 'express';
import { AuthService, LoginRequest } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password }: LoginRequest = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await authService.login({ email, password });

      if (!result.success) {
        return res.status(401).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Login controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async validateToken(req: AuthenticatedRequest, res: Response) {
    try {
      // If middleware passed, user is already validated
      return res.json({
        success: true,
        user: req.user
      });
    } catch (error) {
      console.error('Validate token error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters long'
        });
      }

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error('Change password controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      // For JWT, logout is typically handled client-side by removing the token
      // But we can log the logout activity
      if (req.user?.id) {
        // This could be implemented in auth service to log logout
        console.log(`User ${req.user.id} logged out`);
      }

      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}