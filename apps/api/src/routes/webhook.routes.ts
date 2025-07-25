import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (but secured by Stripe signature verification)
 * @note    This endpoint receives raw body, so it should be before any body parsing middleware
 */
router.post('/stripe', PaymentController.handleWebhook);

export { router as webhookRoutes };