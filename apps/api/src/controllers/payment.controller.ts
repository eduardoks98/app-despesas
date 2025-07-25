/**
 * Payment Controller
 */

import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { logger } from '../utils/logger';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = PaymentService.getInstance();
  }

  createCheckoutSession = async (req: Request, res: Response) => {
    try {
      const { priceId, trialDays } = req.body;
      const userId = req.user.id;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const session = await this.paymentService.createCheckoutSession(userId, priceId, {
        successUrl: `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${req.headers.origin}/subscription/cancel`,
        trialDays,
        allowPromotionCodes: true,
      });

      res.json({ 
        checkoutUrl: session.url,
        sessionId: session.id 
      });
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  };

  getSubscriptionInfo = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const subscriptionInfo = await this.paymentService.getSubscriptionInfo(userId);
      res.json({ subscription: subscriptionInfo });
    } catch (error) {
      logger.error('Failed to get subscription info:', error);
      res.status(500).json({ error: 'Failed to get subscription info' });
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      const event = this.paymentService.verifyWebhookSignature(req.body, signature);
      await this.paymentService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  };
}