/**
 * Payment Service - Stripe Integration
 * 
 * Handles all payment processing, subscriptions, and billing
 */

import Stripe from 'stripe';
import { Database } from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface CreateCustomerData {
  email: string;
  name: string;
  userId: string;
}

export interface CreateSubscriptionData {
  customerId: string;
  priceId: string;
  userId: string;
  trialDays?: number;
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private stripe: Stripe;
  private db: Database;

  private constructor() {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    
    this.db = Database.getInstance();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Create Stripe customer
   */
  async createCustomer(data: CreateCustomerData): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: {
          userId: data.userId,
        },
      });

      // Update user with Stripe customer ID
      await this.db.query(
        'UPDATE users SET stripeCustomerId = ? WHERE id = ?',
        [customer.id, data.userId]
      );

      logger.info('Stripe customer created', { 
        customerId: customer.id, 
        userId: data.userId 
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Get or create customer for user
   */
  async getOrCreateCustomer(userId: string): Promise<string> {
    // Check if user already has a customer ID
    const user = await this.db.queryOne<{ stripeCustomerId: string; email: string; name: string }>(
      'SELECT stripeCustomerId, email, name FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    if (user.stripeCustomerId) {
      // Verify customer still exists in Stripe
      try {
        await this.stripe.customers.retrieve(user.stripeCustomerId);
        return user.stripeCustomerId;
      } catch (error) {
        // Customer doesn't exist, create new one
        logger.warn('Stripe customer not found, creating new one', { userId });
      }
    }

    // Create new customer
    const customer = await this.createCustomer({
      userId,
      email: user.email,
      name: user.name,
    });

    return customer.id;
  }

  /**
   * Create subscription
   */
  async createSubscription(data: CreateSubscriptionData): Promise<Stripe.Subscription> {
    try {
      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: data.customerId,
        items: [{ price: data.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: data.userId,
        },
      };

      // Add trial if specified
      if (data.trialDays && data.trialDays > 0) {
        subscriptionData.trial_period_days = data.trialDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      // Update user subscription info
      await this.updateUserSubscription(data.userId, subscription);

      logger.info('Subscription created', { 
        subscriptionId: subscription.id, 
        userId: data.userId 
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    userId: string, 
    priceId: string, 
    options: {
      successUrl: string;
      cancelUrl: string;
      trialDays?: number;
      allowPromotionCodes?: boolean;
    }
  ): Promise<Stripe.Checkout.Session> {
    try {
      const customerId = await this.getOrCreateCustomer(userId);

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        allow_promotion_codes: options.allowPromotionCodes || false,
        metadata: {
          userId,
        },
      };

      // Add trial if specified
      if (options.trialDays && options.trialDays > 0) {
        sessionData.subscription_data = {
          trial_period_days: options.trialDays,
        };
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);

      logger.info('Checkout session created', { 
        sessionId: session.id, 
        userId 
      });

      return session;
    } catch (error) {
      logger.error('Failed to create checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, immediately = false): Promise<void> {
    try {
      const user = await this.db.queryOne<{ stripeSubscriptionId: string }>(
        'SELECT stripeSubscriptionId FROM users WHERE id = ?',
        [userId]
      );

      if (!user?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      if (immediately) {
        await this.stripe.subscriptions.cancel(user.stripeSubscriptionId);
        
        // Immediately downgrade user
        await this.db.query(
          `UPDATE users 
           SET isPremium = FALSE, subscriptionStatus = 'canceled', updatedAt = NOW()
           WHERE id = ?`,
          [userId]
        );
      } else {
        // Cancel at period end
        await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        await this.db.query(
          'UPDATE users SET subscriptionStatus = "canceled" WHERE id = ?',
          [userId]
        );
      }

      logger.info('Subscription canceled', { 
        subscriptionId: user.stripeSubscriptionId, 
        userId,
        immediately 
      });
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: string): Promise<void> {
    try {
      const user = await this.db.queryOne<{ stripeSubscriptionId: string }>(
        'SELECT stripeSubscriptionId FROM users WHERE id = ?',
        [userId]
      );

      if (!user?.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      await this.stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      await this.db.query(
        'UPDATE users SET subscriptionStatus = "active" WHERE id = ?',
        [userId]
      );

      logger.info('Subscription reactivated', { 
        subscriptionId: user.stripeSubscriptionId, 
        userId 
      });
    } catch (error) {
      logger.error('Failed to reactivate subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Get subscription info
   */
  async getSubscriptionInfo(userId: string): Promise<SubscriptionInfo | null> {
    try {
      const user = await this.db.queryOne<{ stripeSubscriptionId: string }>(
        'SELECT stripeSubscriptionId FROM users WHERE id = ?',
        [userId]
      );

      if (!user?.stripeSubscriptionId) {
        return null;
      }

      const subscription = await this.stripe.subscriptions.retrieve(
        user.stripeSubscriptionId,
        { expand: ['items.data.price'] }
      );

      const price = subscription.items.data[0].price;

      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: price.id,
        amount: price.unit_amount || 0,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
      };
    } catch (error) {
      logger.error('Failed to get subscription info:', error);
      return null;
    }
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(
    userId: string, 
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const customerId = await this.getOrCreateCustomer(userId);

      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info('Billing portal session created', { 
        sessionId: session.id, 
        userId 
      });

      return session;
    } catch (error) {
      logger.error('Failed to create billing portal session:', error);
      throw new Error('Failed to create billing portal session');
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    logger.info('Processing Stripe webhook', { 
      type: event.type, 
      id: event.id 
    });

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        default:
          logger.debug('Unhandled webhook event', { type: event.type });
      }

      // Log webhook event
      await this.logWebhookEvent(event);
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle subscription changes
   */
  private async handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    
    if (!userId) {
      logger.warn('No userId in subscription metadata', { subscriptionId: subscription.id });
      return;
    }

    await this.updateUserSubscription(userId, subscription);
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    
    if (!userId) {
      logger.warn('No userId in subscription metadata', { subscriptionId: subscription.id });
      return;
    }

    await this.db.query(
      `UPDATE users 
       SET isPremium = FALSE, subscriptionStatus = 'canceled', updatedAt = NOW()
       WHERE id = ?`,
      [userId]
    );

    logger.info('User downgraded due to subscription deletion', { userId });
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.customer || !invoice.subscription) {
      return;
    }

    // Log payment
    await this.db.query(
      `INSERT INTO payment_logs (id, user_id, stripe_payment_id, stripe_subscription_id, amount, currency, status, createdAt, updatedAt)
       VALUES (UUID(), (SELECT id FROM users WHERE stripeCustomerId = ?), ?, ?, ?, ?, 'succeeded', NOW(), NOW())`,
      [
        invoice.customer,
        invoice.payment_intent,
        invoice.subscription,
        (invoice.amount_paid || 0) / 100, // Convert from cents
        invoice.currency
      ]
    );

    logger.info('Payment succeeded', { 
      invoiceId: invoice.id,
      amount: invoice.amount_paid 
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.customer) {
      return;
    }

    // Log failed payment
    await this.db.query(
      `INSERT INTO payment_logs (id, user_id, stripe_payment_id, amount, currency, status, createdAt, updatedAt)
       VALUES (UUID(), (SELECT id FROM users WHERE stripeCustomerId = ?), ?, ?, ?, 'failed', NOW(), NOW())`,
      [
        invoice.customer,
        invoice.payment_intent,
        (invoice.amount_due || 0) / 100,
        invoice.currency
      ]
    );

    // Create notification for user
    const userId = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM users WHERE stripeCustomerId = ?',
      [invoice.customer]
    );

    if (userId) {
      await this.db.query(
        `INSERT INTO notifications (id, userId, type, title, message, createdAt)
         VALUES (UUID(), ?, 'payment_failed', 'Payment Failed', 'Your payment could not be processed. Please update your payment method.', NOW())`,
        [userId.id]
      );
    }

    logger.warn('Payment failed', { 
      invoiceId: invoice.id,
      customer: invoice.customer 
    });
  }

  /**
   * Handle checkout completion
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    
    if (!userId) {
      logger.warn('No userId in checkout session metadata');
      return;
    }

    if (session.mode === 'subscription' && session.subscription) {
      // Retrieve full subscription details
      const subscription = await this.stripe.subscriptions.retrieve(
        session.subscription as string
      );
      
      await this.updateUserSubscription(userId, subscription);
    }

    logger.info('Checkout completed', { 
      sessionId: session.id, 
      userId 
    });
  }

  /**
   * Update user subscription data
   */
  private async updateUserSubscription(userId: string, subscription: Stripe.Subscription): Promise<void> {
    const isActive = ['active', 'trialing'].includes(subscription.status);
    const expiresAt = new Date(subscription.current_period_end * 1000);

    await this.db.query(
      `UPDATE users 
       SET isPremium = ?, 
           subscriptionStatus = ?, 
           subscriptionExpiresAt = ?, 
           stripeSubscriptionId = ?,
           updatedAt = NOW()
       WHERE id = ?`,
      [
        isActive,
        subscription.status,
        expiresAt.toISOString().slice(0, 19).replace('T', ' '),
        subscription.id,
        userId
      ]
    );

    logger.info('User subscription updated', { 
      userId, 
      status: subscription.status,
      isPremium: isActive 
    });
  }

  /**
   * Log webhook event
   */
  private async logWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO sync_logs (id, user_id, entity_type, entity_id, action, data, synced_at)
         VALUES (UUID(), 'SYSTEM', 'webhook', ?, 'stripe_event', ?, NOW())`,
        [event.id, JSON.stringify({ type: event.type, created: event.created })]
      );
    } catch (error) {
      logger.error('Failed to log webhook event:', error);
    }
  }

  /**
   * Get available prices
   */
  async getPrices(): Promise<Stripe.Price[]> {
    const prices = await this.stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    return prices.data;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  }
}