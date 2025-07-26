import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '../services/AuthService';
import { Database } from '../config/database';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { User } from '../types/user';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const authService = AuthService.getInstance();
    const decoded = authService.verifyAccessToken(token);
    
    // Get fresh user data from database to check current status
    const db = Database.getInstance();
    const user = await db.queryOne(`
      SELECT id, email, isPremium, subscriptionStatus, subscriptionExpiresAt
      FROM users 
      WHERE id = ? AND deletedAt IS NULL
    `, [decoded.userId]);

    if (!user) {
      logger.warn('Token valid but user not found', { userId: decoded.userId });
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if premium subscription is expired
    if (user.isPremium && user.subscriptionExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(user.subscriptionExpiresAt);
      
      if (now > expiresAt && user.subscriptionStatus === 'active') {
        // Mark subscription as expired (Stripe webhook should handle this)
        await db.query(`
          UPDATE users 
          SET subscriptionStatus = 'expired', updatedAt = NOW()
          WHERE id = ?
        `, [user.id]);
        
        user.subscriptionStatus = 'expired';
        logger.info('Subscription expired', { userId: user.id });
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      isPremium: user.isPremium,
      subscriptionStatus: user.subscriptionStatus,
    };

    next();
  } catch (error: any) {
    logger.error('Authentication failed', error);
    
    if (error.message === 'Token expired') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

export const requirePremium = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isPremium) {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED',
      upgradeUrl: `${env.WEB_URL}/upgrade`
    });
  }
  next();
};

export const requireActivePremium = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isPremium || 
      !['active', 'trialing'].includes(req.user?.subscriptionStatus || '')) {
    return res.status(403).json({ 
      error: 'Active premium subscription required',
      code: 'ACTIVE_PREMIUM_REQUIRED',
      upgradeUrl: `${env.WEB_URL}/upgrade`,
      currentStatus: req.user?.subscriptionStatus
    });
  }
  next();
};

/**
 * Optional authentication - sets user if token is provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without user
    return next();
  }

  try {
    const authService = AuthService.getInstance();
    const decoded = authService.verifyAccessToken(token);
    
    const db = Database.getInstance();
    const user = await db.queryOne(`
      SELECT id, email, isPremium, subscriptionStatus
      FROM users 
      WHERE id = ? AND deletedAt IS NULL
    `, [decoded.userId]);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
      };
    }
  } catch (error) {
    // Invalid token, continue without user
    logger.debug('Optional auth: invalid token provided');
  }

  next();
};

/**
 * Rate limiting based on user type
 */
export const getUserRateLimit = (req: AuthenticatedRequest) => {
  if (req.user?.isPremium) {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // Premium users get 1000 requests per window
    };
  }
  
  return {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Free users get 100 requests per window
  };
};