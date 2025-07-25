'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getStripe, stripeApi, Subscription, Plan, StripeError, subscriptionUtils } from '@/lib/stripe';

export interface UseSubscriptionReturn {
  // State
  subscription: Subscription | null;
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
  
  // Subscription status
  isSubscribed: boolean;
  isTrialing: boolean;
  isPremium: boolean;
  
  // Actions
  subscribe: (priceId: string, trialDays?: number) => Promise<void>;
  cancelSubscription: (immediately?: boolean) => Promise<void>;
  manageBilling: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  
  // Utilities
  formatNextBilling: () => string | null;
  getRemainingTrialDays: () => number | null;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Derived state
  const isSubscribed = subscription ? subscriptionUtils.isActive(subscription) : false;
  const isTrialing = subscription ? subscriptionUtils.isTrialing(subscription) : false;
  const isPremium = isSubscribed || isTrialing;

  // Load initial data
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [subscriptionsResponse, plansResponse] = await Promise.all([
        stripeApi.getSubscriptions(),
        stripeApi.getPrices(),
      ]);

      // Get the most recent active subscription
      const activeSubscription = subscriptionsResponse.subscriptions
        .filter(sub => subscriptionUtils.isActive(sub))
        .sort((a, b) => b.currentPeriodStart - a.currentPeriodStart)[0] || null;

      setSubscription(activeSubscription);
      setPlans(plansResponse.prices);
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      setError(err instanceof StripeError ? err.message : 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to a plan
  const subscribe = useCallback(async (priceId: string, trialDays?: number) => {
    try {
      setError(null);
      
      const { url } = await stripeApi.createCheckoutSession(priceId, 'subscription', trialDays);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      setError(err instanceof StripeError ? err.message : 'Failed to start subscription');
    }
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async (immediately: boolean = false) => {
    if (!subscription) {
      setError('No active subscription found');
      return;
    }

    try {
      setError(null);
      
      const canceledSubscription = await stripeApi.cancelSubscription(subscription.id, immediately);
      
      // Update local state
      setSubscription(prev => prev ? { ...prev, ...canceledSubscription } : null);
      
      // Show success message or redirect
      if (immediately) {
        router.push('/dashboard?message=subscription_canceled');
      } else {
        router.push('/dashboard?message=subscription_will_cancel');
      }
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      setError(err instanceof StripeError ? err.message : 'Failed to cancel subscription');
    }
  }, [subscription, router]);

  // Open billing portal
  const manageBilling = useCallback(async () => {
    try {
      setError(null);
      
      const { url } = await stripeApi.createBillingPortalSession();
      
      // Redirect to Stripe billing portal
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create billing portal session:', err);
      setError(err instanceof StripeError ? err.message : 'Failed to open billing portal');
    }
  }, []);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    await loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Format next billing date
  const formatNextBilling = useCallback((): string | null => {
    if (!subscription || !subscriptionUtils.isActive(subscription)) {
      return null;
    }

    const nextBilling = subscriptionUtils.getCurrentPeriodEnd(subscription);
    
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(nextBilling);
  }, [subscription]);

  // Get remaining trial days
  const getRemainingTrialDays = useCallback((): number | null => {
    if (!subscription || !subscriptionUtils.isTrialing(subscription)) {
      return null;
    }

    const trialEnd = subscriptionUtils.getTrialEnd(subscription);
    if (!trialEnd) return null;

    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, remainingDays);
  }, [subscription]);

  return {
    // State
    subscription,
    plans,
    isLoading,
    error,
    
    // Subscription status
    isSubscribed,
    isTrialing,
    isPremium,
    
    // Actions
    subscribe,
    cancelSubscription,
    manageBilling,
    refreshSubscription,
    
    // Utilities
    formatNextBilling,
    getRemainingTrialDays,
  };
}

// Hook for checking if user has premium access
export function usePremiumAccess() {
  const { isPremium, isLoading } = useSubscription();
  
  return {
    isPremium,
    isLoading,
    requiresPremium: !isPremium && !isLoading,
  };
}

// Hook for subscription alerts (trial ending, payment failed, etc.)
export function useSubscriptionAlerts() {
  const { subscription, isTrialing, getRemainingTrialDays } = useSubscription();
  const [alerts, setAlerts] = useState<Array<{
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>>([]);

  useEffect(() => {
    const newAlerts: typeof alerts = [];

    // Trial ending soon
    if (isTrialing) {
      const remainingDays = getRemainingTrialDays();
      
      if (remainingDays !== null && remainingDays <= 3) {
        newAlerts.push({
          type: 'warning',
          title: 'Teste gratuito terminando',
          message: `Seu teste gratuito termina em ${remainingDays} dia${remainingDays !== 1 ? 's' : ''}. Adicione um método de pagamento para continuar usando os recursos premium.`,
          action: {
            label: 'Adicionar Pagamento',
            onClick: () => window.location.href = '/upgrade',
          },
        });
      }
    }

    // Subscription will cancel at period end
    if (subscription && subscriptionUtils.willCancelAtPeriodEnd(subscription)) {
      const periodEnd = subscriptionUtils.getCurrentPeriodEnd(subscription);
      const endDate = new Intl.DateTimeFormat('pt-BR').format(periodEnd);
      
      newAlerts.push({
        type: 'info',
        title: 'Assinatura será cancelada',
        message: `Sua assinatura será cancelada em ${endDate}. Você continuará tendo acesso aos recursos premium até esta data.`,
        action: {
          label: 'Reativar',
          onClick: () => window.location.href = '/upgrade',
        },
      });
    }

    // Payment failed (subscription past due)
    if (subscription && subscription.status === 'past_due') {
      newAlerts.push({
        type: 'error',
        title: 'Pagamento pendente',
        message: 'Há um problema com seu pagamento. Atualize seu método de pagamento para continuar usando os recursos premium.',
        action: {
          label: 'Atualizar Pagamento',
          onClick: () => window.location.href = '/billing',
        },
      });
    }

    setAlerts(newAlerts);
  }, [subscription, isTrialing, getRemainingTrialDays]);

  return alerts;
}