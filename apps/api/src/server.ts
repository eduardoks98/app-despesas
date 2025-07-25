import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { Database } from './config/database';
import { AuthController } from './controllers/auth.controller';
import { TransactionController } from './controllers/transaction.controller';
import { authenticateToken, requirePremium } from './middleware/auth';
import { validate, schemas } from './middleware/validation';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { paymentRoutes } from './routes/payment.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { trialRoutes } from './routes/trial.routes';
import { startPremiumStatusScheduler } from './middleware/premium';
import { TrialService } from './services/TrialService';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Controllers
const authController = new AuthController();
const transactionController = new TransactionController();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true
}));

// Webhook routes need raw body for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Regular JSON parsing for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'MySys App Despesas API',
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #667eea; }
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
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
}));

// JSON da documentação (para integração com outras ferramentas)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check da API
 *     description: Verifica se a API está funcionando corretamente
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API funcionando normalmente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-01-25T10:00:00.000Z
 *                 environment:
 *                   type: string
 *                   example: production
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes
app.post('/api/auth/register', 
  validate(schemas.register), 
  asyncHandler(authController.register)
);
app.post('/api/auth/login', 
  validate(schemas.login), 
  asyncHandler(authController.login)
);
app.post('/api/auth/refresh', 
  validate(schemas.refreshToken), 
  asyncHandler(authController.refreshToken)
);
app.get('/api/auth/me', 
  authenticateToken, 
  asyncHandler(authController.me)
);
app.post('/api/auth/logout', 
  authenticateToken, 
  asyncHandler(authController.logout)
);

// Transaction routes (Premium required)
app.get('/api/transactions', 
  authenticateToken, 
  requirePremium, 
  validate(schemas.getTransactions),
  asyncHandler(transactionController.getTransactions)
);
app.post('/api/transactions', 
  authenticateToken, 
  requirePremium, 
  validate(schemas.createTransaction),
  asyncHandler(transactionController.createTransaction)
);
app.put('/api/transactions/:id', 
  authenticateToken, 
  requirePremium, 
  validate(schemas.updateTransaction),
  asyncHandler(transactionController.updateTransaction)
);
app.delete('/api/transactions/:id', 
  authenticateToken, 
  requirePremium, 
  validate(schemas.deleteTransaction),
  asyncHandler(transactionController.deleteTransaction)
);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Trial routes
app.use('/api/trial', trialRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler (must be last)
app.use('*', notFoundHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const db = Database.getInstance();
    await db.query('SELECT 1');
    console.log('✅ Database connected successfully');

    // Start background services
    startPremiumStatusScheduler();
    const trialService = TrialService.getInstance();
    trialService.startTrialScheduler();

    app.listen(port, () => {
      console.log(`🚀 API Server running on port ${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${port}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
      console.log(`💰 Premium status scheduler started`);
      console.log(`🎯 Trial scheduler started`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  const db = Database.getInstance();
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  const db = Database.getInstance();
  await db.close();
  process.exit(0);
});

startServer();