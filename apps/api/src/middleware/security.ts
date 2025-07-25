/**
 * Security Middleware
 * 
 * Comprehensive security measures for the API
 */

import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import { Request, Response, NextFunction, Express } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Configure CORS
 */
export const configureCors = () => {
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
      
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  };

  return cors(corsOptions);
};

/**
 * Configure Helmet for security headers
 */
export const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: !env.isDevelopment(),
  });
};

/**
 * SQL Injection prevention
 */
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  // Check all input fields for SQL keywords
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'OR 1=1', 'AND 1=1', '--', '/*', '*/'
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value !== 'string') return true;
    
    const upperValue = value.toUpperCase();
    return !sqlKeywords.some(keyword => upperValue.includes(keyword));
  };

  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        if (!checkObject(value)) return false;
      } else {
        if (!checkValue(value)) return false;
      }
    }
    return true;
  };

  // Check request body, query, and params
  const isClean = checkObject(req.body) && 
                  checkObject(req.query) && 
                  checkObject(req.params);

  if (!isClean) {
    logger.warn('Potential SQL injection attempt', {
      ip: req.ip,
      path: req.path,
      body: req.body,
      query: req.query,
    });
    
    return res.status(400).json({
      error: 'Invalid input detected',
      code: 'INVALID_INPUT',
    });
  }

  next();
};

/**
 * XSS Prevention
 */
export const preventXSS = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize string inputs
  const sanitizeValue = (value: any): any => {
    if (typeof value !== 'string') return value;
    
    // Remove script tags and dangerous attributes
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  };

  const sanitizeObject = (obj: any): void => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      } else {
        obj[key] = sanitizeValue(obj[key]);
      }
    }
  };

  // Sanitize request data
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

/**
 * Request size limiting
 */
export const limitRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    logger.warn('Request size limit exceeded', {
      ip: req.ip,
      size: contentLength,
      maxSize,
    });
    
    return res.status(413).json({
      error: 'Request entity too large',
      code: 'PAYLOAD_TOO_LARGE',
      maxSize: `${maxSize / 1024 / 1024}MB`,
    });
  }

  next();
};

/**
 * Security headers for API responses
 */
export const setSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent caching of sensitive data
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Apply all security middleware
 */
export const applySecurity = (app: Express) => {
  // Basic security
  app.use(configureHelmet());
  app.use(configureCors());
  app.use(compression());
  
  // Data sanitization
  app.use(mongoSanitize());
  app.use(hpp()); // Prevent HTTP Parameter Pollution
  
  // Custom security middleware
  app.use(setSecurityHeaders);
  app.use(limitRequestSize);
  app.use(preventXSS);
  
  // SQL injection prevention for specific routes
  app.use('/api/', preventSQLInjection);
  
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);
  
  // Disable X-Powered-By header
  app.disable('x-powered-by');
  
  logger.info('✅ Security middleware configured');
};