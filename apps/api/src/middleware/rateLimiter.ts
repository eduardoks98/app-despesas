/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting with different limits for free and premium users
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from './auth';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Store for tracking requests (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Get unique identifier for rate limiting
 */
const getIdentifier = (req: Request): string => {
  const authReq = req as AuthenticatedRequest;
  
  // If authenticated, use user ID
  if (authReq.user?.id) {
    return `user:${authReq.user.id}`;
  }
  
  // Otherwise use IP address
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
};

/**
 * Dynamic rate limiter based on user type
 */
export const createRateLimiter = (options?: {
  freeLimit?: number;
  premiumLimit?: number;
  windowMs?: number;
}) => {
  const config = {
    freeLimit: options?.freeLimit || 100,
    premiumLimit: options?.premiumLimit || 1000,
    windowMs: options?.windowMs || parseInt(env.RATE_LIMIT_WINDOW_MS),
  };

  return rateLimit({
    windowMs: config.windowMs,
    max: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.isPremium ? config.premiumLimit : config.freeLimit;
    },
    keyGenerator: getIdentifier,
    handler: (req: Request, res: Response) => {
      const authReq = req as AuthenticatedRequest;
      const isPremium = authReq.user?.isPremium;
      
      logger.warn('Rate limit exceeded', {
        identifier: getIdentifier(req),
        isPremium,
        ip: req.ip,
        userId: authReq.user?.id,
        path: req.path,
      });

      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: isPremium 
          ? 'You have exceeded the premium rate limit. Please try again later.'
          : 'You have exceeded the free tier rate limit. Upgrade to premium for higher limits.',
        retryAfter: res.getHeader('Retry-After'),
        upgradeUrl: !isPremium ? `${env.WEB_URL}/upgrade` : undefined,
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
};

/**
 * Specific rate limiters for different endpoints
 */

// Auth endpoints - stricter limits
export const authRateLimiter = createRateLimiter({
  freeLimit: 5,
  premiumLimit: 20,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

// Password reset - very strict
export const passwordResetRateLimiter = createRateLimiter({
  freeLimit: 3,
  premiumLimit: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
});

// API endpoints - standard limits
export const apiRateLimiter = createRateLimiter({
  freeLimit: parseInt(env.RATE_LIMIT_MAX_REQUESTS),
  premiumLimit: parseInt(env.RATE_LIMIT_MAX_REQUESTS) * 10,
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
});

// Export endpoints - lower limits
export const exportRateLimiter = createRateLimiter({
  freeLimit: 10,
  premiumLimit: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
});

/**
 * Manual rate limiting check (for custom logic)
 */
export const checkRateLimit = (
  identifier: string, 
  limit: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new record
    const resetTime = now + windowMs;
    requestCounts.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
};

/**
 * Clean up expired records periodically
 */
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} expired rate limit records`);
  }
}, 5 * 60 * 1000); // Every 5 minutes