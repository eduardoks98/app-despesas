import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Database } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    planType: 'free' | 'premium';
    subscriptionStatus?: 'active' | 'canceled' | 'expired';
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
    
    // Get user from database to check current plan status
    const db = Database.getInstance();
    const user = await db.queryOne(`
      SELECT id, email, plan_type, subscription_status, subscription_expires_at
      FROM users 
      WHERE id = ?
    `, [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if premium subscription is expired
    if (user.plan_type === 'premium' && user.subscription_expires_at) {
      const now = new Date();
      const expiresAt = new Date(user.subscription_expires_at);
      
      if (now > expiresAt) {
        // Downgrade to free plan
        await db.query(`
          UPDATE users 
          SET plan_type = 'free', subscription_status = 'expired'
          WHERE id = ?
        `, [user.id]);
        
        user.plan_type = 'free';
        user.subscription_status = 'expired';
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      planType: user.plan_type,
      subscriptionStatus: user.subscription_status,
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
  if (req.user?.planType !== 'premium') {
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
  if (req.user?.planType !== 'premium' || 
      req.user?.subscriptionStatus !== 'active') {
    return res.status(403).json({ 
      error: 'Active premium subscription required',
      upgradeUrl: `${process.env.APP_URL}/upgrade`
    });
  }
  next();
};