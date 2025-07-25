import Stripe from 'stripe';
import { logger } from '../utils/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export interface CreateCustomerData {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionData {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

export interface CreatePaymentIntentData {
  amount: number;
  currency: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionData {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode: 'subscription' | 'payment';
  metadata?: Record<string, string>;
  trialPeriodDays?: number;
}

export class StripeService {
  /**
   * Create a new Stripe customer
   */
  static async createCustomer(data: CreateCustomerData): Promise<Stripe.Customer> {
    try {
      logger.info('Creating Stripe customer', { email: data.email });
      
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: {
          ...data.metadata,
          created_at: new Date().toISOString(),
        },
      });

      logger.info('Stripe customer created successfully', { 
        customerId: customer.id,
        email: data.email 
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return null;
      }

      return customer as Stripe.Customer;
    } catch (error) {
      logger.error('Failed to retrieve Stripe customer', { customerId, error });
      return null;
    }
  }

  /**
   * Update customer information
   */
  static async updateCustomer(
    customerId: string,
    data: Partial<CreateCustomerData>
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.update(customerId, {
        email: data.email,
        name: data.name,
        metadata: data.metadata,
      });

      logger.info('Stripe customer updated successfully', { customerId });
      return customer;
    } catch (error) {
      logger.error('Failed to update Stripe customer', { customerId, error });
      throw new Error('Failed to update customer');
    }
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      await stripe.customers.del(customerId);
      logger.info('Stripe customer deleted successfully', { customerId });
      return true;
    } catch (error) {
      logger.error('Failed to delete Stripe customer', { customerId, error });
      return false;
    }
  }

  /**
   * Create a subscription
   */
  static async createSubscription(data: CreateSubscriptionData): Promise<Stripe.Subscription> {
    try {
      logger.info('Creating Stripe subscription', { 
        customerId: data.customerId,
        priceId: data.priceId 
      });

      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: data.customerId,
        items: [{ price: data.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: data.metadata || {},
      };

      if (data.trialPeriodDays) {
        subscriptionData.trial_period_days = data.trialPeriodDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionData);

      logger.info('Stripe subscription created successfully', { 
        subscriptionId: subscription.id,
        customerId: data.customerId 
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create Stripe subscription', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Get subscription by ID
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve Stripe subscription', { subscriptionId, error });
      return null;
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string,
    data: { priceId?: string; metadata?: Record<string, string> }
  ): Promise<Stripe.Subscription> {
    try {
      const updateData: Stripe.SubscriptionUpdateParams = {
        metadata: data.metadata,
      };

      if (data.priceId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        updateData.items = [
          {
            id: subscription.items.data[0].id,
            price: data.priceId,
          },
        ];
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, updateData);
      
      logger.info('Stripe subscription updated successfully', { subscriptionId });
      return subscription;
    } catch (error) {
      logger.error('Failed to update Stripe subscription', { subscriptionId, error });
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
    try {
      let subscription: Stripe.Subscription;

      if (immediately) {
        subscription = await stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      logger.info('Stripe subscription cancelled', { 
        subscriptionId,
        immediately 
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel Stripe subscription', { subscriptionId, error });
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Create a payment intent
   */
  static async createPaymentIntent(data: CreatePaymentIntentData): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency,
        customer: data.customerId,
        description: data.description,
        metadata: data.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info('Stripe payment intent created', { 
        paymentIntentId: paymentIntent.id,
        amount: data.amount 
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create Stripe payment intent', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Create a checkout session
   */
  static async createCheckoutSession(data: CreateCheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      logger.info('Creating Stripe checkout session', { 
        customerId: data.customerId,
        priceId: data.priceId,
        mode: data.mode 
      });

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        customer: data.customerId,
        payment_method_types: ['card'],
        mode: data.mode,
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: data.metadata || {},
      };

      if (data.mode === 'subscription') {
        sessionData.line_items = [
          {
            price: data.priceId,
            quantity: 1,
          },
        ];

        if (data.trialPeriodDays) {
          sessionData.subscription_data = {
            trial_period_days: data.trialPeriodDays,
          };
        }
      } else {
        // For one-time payments, you'd need to pass price data differently
        sessionData.line_items = [
          {
            price: data.priceId,
            quantity: 1,
          },
        ];
      }

      const session = await stripe.checkout.sessions.create(sessionData);

      logger.info('Stripe checkout session created successfully', { 
        sessionId: session.id,
        customerId: data.customerId 
      });

      return session;
    } catch (error) {
      logger.error('Failed to create Stripe checkout session', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a billing portal session
   */
  static async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info('Stripe billing portal session created', { 
        sessionId: session.id,
        customerId 
      });

      return session;
    } catch (error) {
      logger.error('Failed to create billing portal session', { customerId, error });
      throw new Error('Failed to create billing portal session');
    }
  }

  /**
   * Get customer's subscriptions
   */
  static async getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.default_payment_method'],
      });

      return subscriptions.data;
    } catch (error) {
      logger.error('Failed to get customer subscriptions', { customerId, error });
      return [];
    }
  }

  /**
   * Get customer's payment methods
   */
  static async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to get customer payment methods', { customerId, error });
      return [];
    }
  }

  /**
   * Process webhook event
   */
  static async processWebhookEvent(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Promise<Stripe.Event> {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      
      logger.info('Stripe webhook event received', { 
        eventType: event.type,
        eventId: event.id 
      });

      return event;
    } catch (error) {
      logger.error('Failed to process Stripe webhook', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get all prices for products
   */
  static async getPrices(): Promise<Stripe.Price[]> {
    try {
      const prices = await stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });

      return prices.data;
    } catch (error) {
      logger.error('Failed to get Stripe prices', error);
      return [];
    }
  }

  /**
   * Get price by ID
   */
  static async getPrice(priceId: string): Promise<Stripe.Price | null> {
    try {
      const price = await stripe.prices.retrieve(priceId, {
        expand: ['product'],
      });

      return price;
    } catch (error) {
      logger.error('Failed to get Stripe price', { priceId, error });
      return null;
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: reason as Stripe.RefundCreateParams.Reason,
      };

      if (amount) {
        refundData.amount = amount;
      }

      const refund = await stripe.refunds.create(refundData);

      logger.info('Stripe refund created', { 
        refundId: refund.id,
        paymentIntentId,
        amount 
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create Stripe refund', { paymentIntentId, error });
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      logger.error('Failed to get Stripe invoice', { invoiceId, error });
      return null;
    }
  }

  /**
   * Get customer's invoices
   */
  static async getCustomerInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit: 100,
      });

      return invoices.data;
    } catch (error) {
      logger.error('Failed to get customer invoices', { customerId, error });
      return [];
    }
  }
}

export { stripe };