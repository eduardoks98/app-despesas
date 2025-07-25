import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Database } from '../config/database';
import { syncPremiumStatus } from './premium';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isPremium: boolean;
    subscriptionStatus?: string;
    subscriptionExpiresAt?: Date | null;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const db = Database.getInstance();
    const user = await db.queryOne(`
      SELECT id, email, isPremium, subscriptionStatus, subscriptionExpiresAt
      FROM users 
      WHERE id = ?
    `, [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      isPremium: user.isPremium,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
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
      upgradeUrl: `${process.env.APP_URL}/upgrade`
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
      upgradeUrl: `${process.env.APP_URL}/upgrade`
    });
  }
  next();
};

// Middleware that automatically syncs premium status before checking
export const auth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  await authenticateToken(req, res, async () => {
    await syncPremiumStatus(req, res, next);
  });
};