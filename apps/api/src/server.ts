import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { Database } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';
import { applySecurity } from './middleware/security';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import routes from './routes';

const app = express();
const port = parseInt(env.PORT);

// Apply security middleware
applySecurity(app);

// JSON and URL-encoded parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(logger.requestLogger());

// Rate limiting
app.use('/api/', apiRateLimiter);

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'App Despesas API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #8B5CF6; }
    .swagger-ui .scheme-container {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
    }
  `,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: env.NODE_ENV !== 'production',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
}));

// JSON documentation endpoint
app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler (must be last)
app.use('*', notFoundHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const db = Database.getInstance();
    const isConnected = await db.healthCheck();
    
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Clean up expired tokens periodically
    const authService = (await import('./services/AuthService')).AuthService.getInstance();
    setInterval(async () => {
      try {
        await authService.cleanExpiredTokens();
      } catch (error) {
        logger.error('Failed to clean expired tokens:', error);
      }
    }, 60 * 60 * 1000); // Every hour

    app.listen(port, () => {
      logger.info(`🚀 API Server running on port ${port}`);
      logger.info(`📊 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${port}/api/health`);
      logger.info(`📚 API Documentation: http://localhost:${port}/docs`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('🛑 Graceful shutdown initiated');
  
  try {
    const db = Database.getInstance();
    await db.close();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error during shutdown:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();