import { loadStripe, Stripe } from '@stripe/stripe-js';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    }
    
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  
  return stripePromise;
};

// Stripe configuration options
export const stripeOptions = {
  locale: 'pt-BR' as const,
};

// Helper function to format price for display
export const formatPrice = (price: number, currency: string = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price / 100); // Stripe amounts are in cents
};

// Helper function to format subscription interval
export const formatInterval = (interval: string, intervalCount: number = 1): string => {
  const intervalMap: Record<string, string> = {
    day: intervalCount === 1 ? 'dia' : 'dias',
    week: intervalCount === 1 ? 'semana' : 'semanas',
    month: intervalCount === 1 ? 'mês' : 'meses',
    year: intervalCount === 1 ? 'ano' : 'anos',
  };

  const intervalText = intervalMap[interval] || interval;
  
  if (intervalCount === 1) {
    return `por ${intervalText}`;
  }
  
  return `a cada ${intervalCount} ${intervalText}`;
};

// Price/Plan interface
export interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  trialPeriodDays?: number;
  features: PlanFeature[];
  recommended?: boolean;
  popular?: boolean;
}

// Subscription interface
export interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  canceledAt?: number;
  trialStart?: number;
  trialEnd?: number;
  items: Array<{
    id: string;
    priceId: string;
    productId: string;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  }>;
}

// Payment method interface
export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  created: number;
}

// Invoice interface
export interface Invoice {
  id: string;
  number: string;
  status: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  created: number;
  dueDate?: number;
  paidAt?: number;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  subscriptionId?: string;
}

// API response interfaces
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface BillingPortalResponse {
  url: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Error handling
export class StripeError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'StripeError';
  }
}

// API utility functions
export const stripeApi = {
  async createCheckoutSession(priceId: string, mode: 'subscription' | 'payment' = 'subscription', trialDays?: number): Promise<CheckoutSessionResponse> {
    const response = await fetch('/api/payment/checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        mode,
        trialDays,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new StripeError(error.error || 'Failed to create checkout session');
    }

    return response.json();
  },

  async createBillingPortalSession(): Promise<BillingPortalResponse> {
    const response = await fetch('/api/payment/billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new StripeError(error.error || 'Failed to create billing portal session');
    }

    return response.json();
  },

  async createPaymentIntent(amount: number, currency: string = 'brl', description?: string): Promise<PaymentIntentResponse> {
    const response = await fetch('/api/payment/payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        description,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new StripeError(error.error || 'Failed to create payment intent');
    }

    return response.json();
  },

  async getSubscriptions(): Promise<{ subscriptions: Subscription[] }> {
    const response = await fetch('/api/payment/subscriptions');

    if (!response.ok) {
      const error = await response.json();
      throw new StripeError(error.error || 'Failed to get subscriptions');
    }

    return response.json();
  },

  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Subscription> {
    const response = await fetch(`/api/payment/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        immediately,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new StripeError(error.error || 'Failed to cancel subscription');
    }

    return response.json();
  },

  async getPaymentMethods(): Promise<{ paymentMethods: PaymentMethod[] }> {
    const response = await fetch('/api/payment/payment-methods');

    if (!response.ok) {
      const error = await response.json();
      throw new StripeError(error.error || 'Failed to get payment methods');
    }

    return response.json();
  },

  async getInvoices(): Promise<{ invoices: Invoice[] }> {
    const response = await fetch('/api/payment/invoices');

    if (!response.ok) {
      const error = await response.json();
      throw new StripeError(error.error || 'Failed to get invoices');
    }

    return response.json();
  },

  async getPrices(): Promise<{ prices: Plan[] }> {
    const response = await fetch('/api/payment/prices');

    if (!response.ok) {
      const error = await response.json();
      throw new StripeError(error.error || 'Failed to get prices');
    }

    return response.json();
  },
};

// Utility functions for subscription status
export const subscriptionUtils = {
  isActive(subscription: Subscription): boolean {
    return ['active', 'trialing'].includes(subscription.status);
  },

  isTrialing(subscription: Subscription): boolean {
    return subscription.status === 'trialing';
  },

  isCanceled(subscription: Subscription): boolean {
    return subscription.status === 'canceled';
  },

  willCancelAtPeriodEnd(subscription: Subscription): boolean {
    return subscription.cancelAtPeriodEnd;
  },

  getCurrentPeriodEnd(subscription: Subscription): Date {
    return new Date(subscription.currentPeriodEnd * 1000);
  },

  getTrialEnd(subscription: Subscription): Date | null {
    return subscription.trialEnd ? new Date(subscription.trialEnd * 1000) : null;
  },

  getDaysUntilRenewal(subscription: Subscription): number {
    const now = new Date();
    const periodEnd = this.getCurrentPeriodEnd(subscription);
    const diffTime = periodEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
};