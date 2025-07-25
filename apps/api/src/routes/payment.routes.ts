import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication middleware to all payment routes
router.use(authMiddleware);

/**
 * @route   POST /api/payment/checkout-session
 * @desc    Create a checkout session for subscription or one-time payment
 * @access  Private
 */
router.post('/checkout-session', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  PaymentController.createCheckoutSession
);

/**
 * @route   POST /api/payment/billing-portal
 * @desc    Create a billing portal session for subscription management
 * @access  Private
 */
router.post('/billing-portal',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
  PaymentController.createBillingPortalSession
);

/**
 * @route   POST /api/payment/payment-intent
 * @desc    Create a payment intent for one-time payments
 * @access  Private
 */
router.post('/payment-intent',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
  PaymentController.createPaymentIntent
);

/**
 * @route   GET /api/payment/subscriptions
 * @desc    Get user's subscriptions
 * @access  Private
 */
router.get('/subscriptions', PaymentController.getSubscriptions);

/**
 * @route   POST /api/payment/subscriptions/:subscriptionId/cancel
 * @desc    Cancel a subscription
 * @access  Private
 */
router.post('/subscriptions/:subscriptionId/cancel',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }), // 3 requests per 15 minutes
  PaymentController.cancelSubscription
);

/**
 * @route   GET /api/payment/payment-methods
 * @desc    Get user's payment methods
 * @access  Private
 */
router.get('/payment-methods', PaymentController.getPaymentMethods);

/**
 * @route   GET /api/payment/invoices
 * @desc    Get user's invoices
 * @access  Private
 */
router.get('/invoices', PaymentController.getInvoices);

/**
 * @route   GET /api/payment/prices
 * @desc    Get available subscription prices/plans
 * @access  Private
 */
router.get('/prices', PaymentController.getPrices);

export { router as paymentRoutes };