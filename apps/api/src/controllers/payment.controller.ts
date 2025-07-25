/**
 * Payment Controller
 * 
 * Handles payment-related API endpoints
 */

import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class PaymentController {
  private static instance: PaymentController;
  private paymentService: PaymentService;

  private constructor() {
    this.paymentService = PaymentService.getInstance();
  }

  public static getInstance(): PaymentController {
    if (!PaymentController.instance) {
      PaymentController.instance = new PaymentController();
    }
    return PaymentController.instance;
  }

  /**
   * @swagger
   * /api/payments/create-checkout:
   *   post:
   *     summary: Create checkout session for subscription
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - priceId
   *             properties:
   *               priceId:
   *                 type: string
   *                 example: price_1234567890
   *               trialDays:
   *                 type: number
   *                 example: 14
   *     responses:
   *       200:
   *         description: Checkout session created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 sessionId:
   *                   type: string
   *                 url:
   *                   type: string
   */
  public createCheckout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { priceId, trialDays } = req.body;
      const userId = req.user!.id;

      if (!priceId) {
        return res.status(400).json({ 
          error: 'Price ID is required',
          code: 'MISSING_PRICE_ID'
        });
      }

      // Construct URLs
      const baseUrl = env.WEB_URL || 'http://localhost:3000';
      const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/subscription/canceled`;

      const session = await this.paymentService.createCheckoutSession(userId, priceId, {
        successUrl,
        cancelUrl,
        trialDays,
        allowPromotionCodes: true,
      });

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      logger.error('Create checkout error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to create checkout session',
        code: 'CHECKOUT_CREATION_FAILED'
      });
    }
  };

  /**
   * @swagger
   * /api/payments/subscription:
   *   get:
   *     summary: Get current subscription info
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Subscription information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 subscription:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     status:
   *                       type: string
   *                     currentPeriodStart:
   *                       type: string
   *                       format: date-time
   *                     currentPeriodEnd:
   *                       type: string
   *                       format: date-time
   *                     cancelAtPeriodEnd:
   *                       type: boolean
   *                     amount:
   *                       type: number
   *                     currency:
   *                       type: string
   *                     interval:
   *                       type: string
   */
  public getSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const subscription = await this.paymentService.getSubscriptionInfo(userId);

      res.json({ subscription });
    } catch (error: any) {
      logger.error('Get subscription error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get subscription info',
        code: 'SUBSCRIPTION_FETCH_FAILED'
      });
    }
  };

  /**
   * @swagger
   * /api/payments/cancel-subscription:
   *   post:
   *     summary: Cancel subscription
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               immediately:
   *                 type: boolean
   *                 default: false
   *     responses:
   *       200:
   *         description: Subscription canceled
   */
  public cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { immediately = false } = req.body;
      const userId = req.user!.id;

      await this.paymentService.cancelSubscription(userId, immediately);

      res.json({ 
        message: immediately 
          ? 'Subscription canceled immediately' 
          : 'Subscription will be canceled at the end of the current period',
        immediately 
      });
    } catch (error: any) {
      logger.error('Cancel subscription error:', error);
      
      if (error.message === 'No active subscription found') {
        return res.status(404).json({ 
          error: 'No active subscription found',
          code: 'NO_SUBSCRIPTION'
        });
      }
      
      res.status(500).json({ 
        error: error.message || 'Failed to cancel subscription',
        code: 'CANCELLATION_FAILED'
      });
    }
  };

  /**
   * @swagger
   * /api/payments/reactivate-subscription:
   *   post:
   *     summary: Reactivate canceled subscription
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Subscription reactivated
   */
  public reactivateSubscription = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      await this.paymentService.reactivateSubscription(userId);

      res.json({ message: 'Subscription reactivated successfully' });
    } catch (error: any) {
      logger.error('Reactivate subscription error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to reactivate subscription',
        code: 'REACTIVATION_FAILED'
      });
    }
  };

  /**
   * @swagger
   * /api/payments/billing-portal:
   *   post:
   *     summary: Create billing portal session
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Billing portal session created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 url:
   *                   type: string
   */
  public createBillingPortal = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const returnUrl = env.WEB_URL || 'http://localhost:3000';

      const session = await this.paymentService.createBillingPortalSession(userId, returnUrl);

      res.json({ url: session.url });
    } catch (error: any) {
      logger.error('Create billing portal error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to create billing portal session',
        code: 'BILLING_PORTAL_FAILED'
      });
    }
  };

  /**
   * @swagger
   * /api/payments/prices:
   *   get:
   *     summary: Get available subscription prices
   *     tags: [Payments]
   *     responses:
   *       200:
   *         description: Available prices
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 prices:
   *                   type: array
   *                   items:
   *                     type: object
   */
  public getPrices = async (req: Request, res: Response) => {
    try {
      const prices = await this.paymentService.getPrices();
      
      // Filter and format prices for frontend
      const formattedPrices = prices
        .filter(price => price.active && price.type === 'recurring')
        .map(price => ({
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          intervalCount: price.recurring?.interval_count,
          product: price.product,
        }));

      res.json({ prices: formattedPrices });
    } catch (error: any) {
      logger.error('Get prices error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get prices',
        code: 'PRICES_FETCH_FAILED'
      });
    }
  };

  /**
   * @swagger
   * /api/payments/webhook:
   *   post:
   *     summary: Stripe webhook endpoint
   *     tags: [Payments]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Webhook processed successfully
   *       400:
   *         description: Invalid webhook signature
   */
  public handleWebhook = async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      // Verify webhook signature and construct event
      const event = this.paymentService.verifyWebhookSignature(
        req.body,
        signature
      );

      // Process the event
      await this.paymentService.handleWebhook(event);

      res.json({ received: true });
    } catch (error: any) {
      logger.error('Webhook error:', error);
      
      if (error.message?.includes('signature')) {
        return res.status(400).json({ 
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }
      
      res.status(500).json({ 
        error: 'Webhook processing failed',
        code: 'WEBHOOK_FAILED'
      });
    }
  };

  /**
   * @swagger
   * /api/payments/usage:
   *   get:
   *     summary: Get usage statistics for current billing period
   *     tags: [Payments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Usage statistics
   */
  public getUsage = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Get current billing period
      const subscription = await this.paymentService.getSubscriptionInfo(userId);
      
      if (!subscription) {
        return res.json({ 
          usage: null,
          message: 'No active subscription' 
        });
      }

      // Calculate usage (example metrics)
      const startDate = subscription.currentPeriodStart.toISOString().slice(0, 19).replace('T', ' ');
      const endDate = subscription.currentPeriodEnd.toISOString().slice(0, 19).replace('T', ' ');

      // Get usage data from database
      const usage = await this.paymentService['db'].query(`
        SELECT 
          COUNT(*) as totalRequests,
          COUNT(DISTINCT DATE(created_at)) as activeDays
        FROM usage_analytics 
        WHERE user_id = ? AND created_at BETWEEN ? AND ?
      `, [userId, startDate, endDate]);

      res.json({
        usage: usage[0] || { totalRequests: 0, activeDays: 0 },
        billingPeriod: {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd,
        },
      });
    } catch (error: any) {
      logger.error('Get usage error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get usage data',
        code: 'USAGE_FETCH_FAILED'
      });
    }
  };
}