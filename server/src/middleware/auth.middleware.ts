import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: {
      id: number;
      name: string;
      permissions: string[];
    };
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Handle development tokens
    if (token.startsWith('dev-token-')) {
      console.log('Development token detected, bypassing JWT verification');
      // Create a mock user for development
      (req as any).user = {
        id: 1,
        email: 'dev@test.com',
        name: 'Development User',
        role: {
          id: 1,
          name: 'MANAGER',
          permissions: JSON.stringify([
            'ALL_PERMISSIONS',
            'MANAGE_PRODUCTS',
            'MANAGE_USERS',
            'VIEW_REPORTS',
            'APPROVE_EXCHANGES',
            'APPROVE_RETURNS',
            'MANAGE_DISCOUNTS',
            'VIEW_COST_PRICES'
          ])
        }
      };
      return next();
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: number };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Parse permissions from JSON string
    const permissions = JSON.parse(user.role.permissions);
    
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: {
        id: user.role.id,
        name: user.role.name,
        permissions: permissions
      }
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = 
      req.user.role.permissions.includes('ALL_PERMISSIONS') ||
      req.user.role.permissions.includes(permission);

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        userPermissions: req.user.role.permissions
      });
    }

    next();
  };
};