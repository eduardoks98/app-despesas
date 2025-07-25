import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service';
import { logger } from '../utils/logger';
import Stripe from 'stripe';

export class PaymentController {
  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(req: Request, res: Response) {
    try {
      const { priceId, mode = 'subscription', trialDays } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      // Get or create Stripe customer
      let stripeCustomerId = req.user?.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await StripeService.createCustomer({
          email: req.user?.email!,
          name: req.user?.name || req.user?.email!,
          metadata: {
            userId: userId.toString(),
          },
        });
        
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        // await UserService.updateStripeCustomerId(userId, stripeCustomerId);
      }

      const session = await StripeService.createCheckoutSession({
        customerId: stripeCustomerId,
        priceId,
        mode: mode as 'subscription' | 'payment',
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?cancelled=true`,
        metadata: {
          userId: userId.toString(),
        },
        trialPeriodDays: trialDays,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      logger.error('Failed to create checkout session', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }

  /**
   * Create billing portal session
   */
  static async createBillingPortalSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const stripeCustomerId = req.user?.stripeCustomerId;

      if (!userId || !stripeCustomerId) {
        return res.status(400).json({ error: 'User or customer not found' });
      }

      const session = await StripeService.createBillingPortalSession(
        stripeCustomerId,
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      logger.error('Failed to create billing portal session', error);
      res.status(500).json({ error: 'Failed to create billing portal session' });
    }
  }

  /**
   * Get customer subscriptions
   */
  static async getSubscriptions(req: Request, res: Response) {
    try {
      const stripeCustomerId = req.user?.stripeCustomerId;

      if (!stripeCustomerId) {
        return res.json({ subscriptions: [] });
      }

      const subscriptions = await StripeService.getCustomerSubscriptions(stripeCustomerId);

      // Transform subscription data for frontend
      const transformedSubscriptions = subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: sub.canceled_at,
        trialStart: sub.trial_start,
        trialEnd: sub.trial_end,
        items: sub.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
          productId: item.price.product,
          amount: item.price.unit_amount,
          currency: item.price.currency,
          interval: item.price.recurring?.interval,
          intervalCount: item.price.recurring?.interval_count,
        })),
      }));

      res.json({ subscriptions: transformedSubscriptions });
    } catch (error) {
      logger.error('Failed to get subscriptions', error);
      res.status(500).json({ error: 'Failed to get subscriptions' });
    }
  }

  /**
   * Get customer payment methods
   */
  static async getPaymentMethods(req: Request, res: Response) {
    try {
      const stripeCustomerId = req.user?.stripeCustomerId;

      if (!stripeCustomerId) {
        return res.json({ paymentMethods: [] });
      }

      const paymentMethods = await StripeService.getCustomerPaymentMethods(stripeCustomerId);

      // Transform payment method data
      const transformedPaymentMethods = paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        } : null,
        created: pm.created,
      }));

      res.json({ paymentMethods: transformedPaymentMethods });
    } catch (error) {
      logger.error('Failed to get payment methods', error);
      res.status(500).json({ error: 'Failed to get payment methods' });
    }
  }

  /**
   * Get customer invoices
   */
  static async getInvoices(req: Request, res: Response) {
    try {
      const stripeCustomerId = req.user?.stripeCustomerId;

      if (!stripeCustomerId) {
        return res.json({ invoices: [] });
      }

      const invoices = await StripeService.getCustomerInvoices(stripeCustomerId);

      // Transform invoice data
      const transformedInvoices = invoices.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amountPaid: invoice.amount_paid,
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        created: invoice.created,
        dueDate: invoice.due_date,
        paidAt: invoice.status_transitions?.paid_at,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        subscriptionId: invoice.subscription,
      }));

      res.json({ invoices: transformedInvoices });
    } catch (error) {
      logger.error('Failed to get invoices', error);
      res.status(500).json({ error: 'Failed to get invoices' });
    }
  }

  /**
   * Get available prices/plans
   */
  static async getPrices(req: Request, res: Response) {
    try {
      const prices = await StripeService.getPrices();

      // Transform price data for frontend
      const transformedPrices = prices.map(price => ({
        id: price.id,
        productId: price.product,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
        trialPeriodDays: price.recurring?.trial_period_days,
        active: price.active,
        nickname: price.nickname,
        product: typeof price.product === 'object' ? {
          id: price.product.id,
          name: price.product.name,
          description: price.product.description,
          features: price.product.metadata?.features ? 
            JSON.parse(price.product.metadata.features) : [],
        } : null,
      }));

      res.json({ prices: transformedPrices });
    } catch (error) {
      logger.error('Failed to get prices', error);
      res.status(500).json({ error: 'Failed to get prices' });
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(req: Request, res: Response) {
    try {
      const { subscriptionId } = req.params;
      const { immediately = false } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verify the subscription belongs to the user
      const subscription = await StripeService.getSubscription(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Additional security check - verify customer matches
      if (subscription.customer !== req.user?.stripeCustomerId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const cancelledSubscription = await StripeService.cancelSubscription(
        subscriptionId,
        immediately
      );

      res.json({
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
        canceledAt: cancelledSubscription.canceled_at,
        currentPeriodEnd: cancelledSubscription.current_period_end,
      });
    } catch (error) {
      logger.error('Failed to cancel subscription', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }

  /**
   * Create payment intent for one-time payments
   */
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, currency = 'brl', description } = req.body;
      const userId = req.user?.id;
      const stripeCustomerId = req.user?.stripeCustomerId;

      if (!userId || !stripeCustomerId) {
        return res.status(400).json({ error: 'User or customer not found' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const paymentIntent = await StripeService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customerId: stripeCustomerId,
        description,
        metadata: {
          userId: userId.toString(),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      logger.error('Failed to create payment intent', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      if (!signature || !endpointSecret) {
        return res.status(400).json({ error: 'Missing webhook signature or secret' });
      }

      const event = await StripeService.processWebhookEvent(
        req.body,
        signature,
        endpointSecret
      );

      // Handle different event types
      await PaymentController.processWebhookEvent(event);

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook processing failed', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process webhook events
   */
  private static async processWebhookEvent(event: Stripe.Event) {
    logger.info('Processing webhook event', { 
      eventType: event.type,
      eventId: event.id 
    });

    switch (event.type) {
      case 'customer.subscription.created':
        await PaymentController.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await PaymentController.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await PaymentController.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await PaymentController.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await PaymentController.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await PaymentController.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'payment_intent.succeeded':
        await PaymentController.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await PaymentController.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        logger.info('Unhandled webhook event type', { eventType: event.type });
    }
  }

  private static async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    logger.info('Subscription created', { subscriptionId: subscription.id });
    // Update user subscription status in database
    // await UserService.activateSubscription(userId, subscription);
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    logger.info('Subscription updated', { subscriptionId: subscription.id });
    // Update subscription status in database
    // await UserService.updateSubscriptionStatus(userId, subscription);
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    logger.info('Subscription deleted', { subscriptionId: subscription.id });
    // Deactivate user subscription
    // await UserService.deactivateSubscription(userId);
  }

  private static async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    logger.info('Invoice payment succeeded', { invoiceId: invoice.id });
    // Update payment status, extend subscription, etc.
  }

  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    logger.info('Invoice payment failed', { invoiceId: invoice.id });
    // Handle failed payment, notify user, etc.
  }

  private static async handleTrialWillEnd(subscription: Stripe.Subscription) {
    logger.info('Trial will end', { subscriptionId: subscription.id });
    // Notify user about trial ending
  }

  private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });
    // Handle successful one-time payment
  }

  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    logger.info('Payment failed', { paymentIntentId: paymentIntent.id });
    // Handle failed payment
  }
}