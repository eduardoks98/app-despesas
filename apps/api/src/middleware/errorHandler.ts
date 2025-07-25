import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  isOperational = true;

  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  isOperational = true;

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class PremiumRequiredError extends Error {
  statusCode = 402;
  isOperational = true;

  constructor(message: string = 'Premium subscription required') {
    super(message);
    this.name = 'PremiumRequiredError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  isOperational = true;

  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.name || 'INTERNAL_ERROR';

  // Log error details
  if (statusCode >= 500) {
    console.error('Internal server error:', {
      error: err,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      user: (req as any).user?.id
    });
  } else {
    console.warn('Client error:', {
      error: err.message,
      statusCode,
      url: req.url,
      method: req.method,
      user: (req as any).user?.id
    });
  }

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      const validationErr = err as ValidationError;
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: validationErr.details
      });

    case 'JsonWebTokenError':
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Token inválido'
      });

    case 'TokenExpiredError':
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Token expirado'
      });

    case 'MongoError':
    case 'DatabaseError':
      if (err.message.includes('duplicate key')) {
        return res.status(409).json({
          error: 'DUPLICATE_RESOURCE',
          message: 'Recurso já existe'
        });
      }
      // Don't expose database errors to client
      statusCode = 500;
      message = 'Database error';
      errorCode = 'DATABASE_ERROR';
      break;

    case 'SyntaxError':
      if (err.message.includes('JSON')) {
        return res.status(400).json({
          error: 'INVALID_JSON',
          message: 'JSON inválido'
        });
      }
      break;

    case 'PremiumRequiredError':
      return res.status(402).json({
        error: 'PREMIUM_REQUIRED',
        message: 'Este recurso está disponível apenas para usuários premium',
        upgradeUrl: `${process.env.APP_URL}/upgrade`
      });

    case 'RateLimitError':
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
        retryAfter: 60
      });
  }

  // Default error response
  res.status(statusCode).json({
    error: errorCode,
    message: statusCode >= 500 ? 'Erro interno do servidor' : message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'ENDPOINT_NOT_FOUND',
    message: `Endpoint ${req.method} ${req.path} não encontrado`
  });
};

// Health check error
export const healthCheckError = (service: string, error: any) => {
  console.error(`Health check failed for ${service}:`, error);
  return {
    service,
    status: 'error',
    error: error.message,
    timestamp: new Date().toISOString()
  };
};