/**
 * API Routes Configuration
 */

import { Router } from 'express';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import { authenticateToken, requirePremium } from '../middleware/auth';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/transactions', authenticateToken, transactionRoutes);

// Premium routes example
router.get('/premium/reports', authenticateToken, requirePremium, (req, res) => {
  res.json({ message: 'Premium reports endpoint' });
});

export default router;