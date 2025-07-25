import { Router } from 'express';
import { PIXController } from '../controllers/pix.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication middleware to all PIX routes except webhooks
router.use((req, res, next) => {
  if (req.path === '/webhook') {
    return next(); // Skip auth for webhooks
  }
  return authMiddleware(req, res, next);
});

/**
 * @route   POST /api/pix/charges
 * @desc    Create a PIX charge for one-time payment
 * @access  Private
 */
router.post('/charges', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 charges per 15 minutes
  PIXController.createCharge
);

/**
 * @route   GET /api/pix/charges/:chargeId
 * @desc    Get PIX charge status
 * @access  Private
 */
router.get('/charges/:chargeId', PIXController.getCharge);

/**
 * @route   POST /api/pix/charges/:chargeId/cancel
 * @desc    Cancel a PIX charge
 * @access  Private
 */
router.post('/charges/:chargeId/cancel',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 cancellations per 15 minutes
  PIXController.cancelCharge
);

/**
 * @route   GET /api/pix/charges
 * @desc    Get user's PIX charges
 * @access  Private
 */
router.get('/charges', PIXController.getUserCharges);

/**
 * @route   GET /api/pix/key
 * @desc    Get PIX key for manual payments
 * @access  Private
 */
router.get('/key', PIXController.getPixKey);

/**
 * @route   POST /api/pix/webhook
 * @desc    Handle PIX webhook events
 * @access  Public (but secured by signature verification)
 */
router.post('/webhook', PIXController.handleWebhook);

export { router as pixRoutes };