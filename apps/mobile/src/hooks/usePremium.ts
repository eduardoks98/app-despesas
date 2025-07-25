/**
 * Premium Hook - Manages premium features and access control
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'sync' | 'reports' | 'export' | 'backup' | 'advanced';
}

export interface PremiumLimits {
  maxCategories: number;
  maxTransactionsPerMonth: number;
  maxBackups: number;
  exportFormats: string[];
  syncDevices: number;
}

const FREE_LIMITS: PremiumLimits = {
  maxCategories: 10,
  maxTransactionsPerMonth: 100,
  maxBackups: 0,
  exportFormats: [],
  syncDevices: 1,
};

const PREMIUM_LIMITS: PremiumLimits = {
  maxCategories: -1, // Unlimited
  maxTransactionsPerMonth: -1, // Unlimited
  maxBackups: -1, // Unlimited
  exportFormats: ['PDF', 'Excel', 'CSV'],
  syncDevices: -1, // Unlimited
};

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'sync',
    name: 'Sincronização Automática',
    description: 'Sincronize seus dados entre todos os dispositivos automaticamente',
    icon: 'cloud-upload-outline',
    category: 'sync',
  },
  {
    id: 'backup',
    name: 'Backup na Nuvem',
    description: 'Backup automático e seguro dos seus dados na nuvem',
    icon: 'shield-checkmark-outline',
    category: 'backup',
  },
  {
    id: 'web_access',
    name: 'Acesso Web',
    description: 'Acesse suas finanças de qualquer computador',
    icon: 'desktop-outline',
    category: 'advanced',
  },
  {
    id: 'advanced_reports',
    name: 'Relatórios Avançados',
    description: 'Gráficos detalhados, tendências e insights sobre seus gastos',
    icon: 'analytics-outline',
    category: 'reports',
  },
  {
    id: 'unlimited_categories',
    name: 'Categorias Ilimitadas',
    description: 'Crie quantas categorias personalizadas precisar',
    icon: 'infinite-outline',
    category: 'advanced',
  },
  {
    id: 'export_data',
    name: 'Exportação Completa',
    description: 'Exporte seus dados em PDF, Excel e CSV',
    icon: 'document-text-outline',
    category: 'export',
  },
  {
    id: 'transaction_tags',
    name: 'Tags e Notas',
    description: 'Adicione tags e notas detalhadas às suas transações',
    icon: 'pricetag-outline',
    category: 'advanced',
  },
  {
    id: 'multiple_accounts',
    name: 'Múltiplas Contas',
    description: 'Gerencie várias contas bancárias e cartões',
    icon: 'card-outline',
    category: 'advanced',
  },
  {
    id: 'budgets',
    name: 'Orçamentos e Metas',
    description: 'Defina orçamentos e acompanhe suas metas financeiras',
    icon: 'target-outline',
    category: 'advanced',
  },
  {
    id: 'priority_support',
    name: 'Suporte Prioritário',
    description: 'Atendimento prioritário e suporte técnico especializado',
    icon: 'headset-outline',
    category: 'advanced',
  },
];

export const usePremium = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PremiumLimits>(FREE_LIMITS);

  useEffect(() => {
    if (user?.isPremium) {
      setLimits(PREMIUM_LIMITS);
    } else {
      setLimits(FREE_LIMITS);
    }
  }, [user?.isPremium]);

  /**
   * Check if user has access to a specific feature
   */
  const hasFeature = (featureId: string): boolean => {
    if (!user?.isPremium) {
      return false;
    }

    // Check if subscription is active or trialing
    return ['active', 'trialing'].includes(user.subscriptionStatus || '');
  };

  /**
   * Check if user can perform an action based on limits
   */
  const canPerform = (action: keyof PremiumLimits, currentCount: number): boolean => {
    const limit = limits[action];
    
    // -1 means unlimited (premium feature)
    if (limit === -1) {
      return true;
    }
    
    // Check if current count is within limit
    return currentCount < limit;
  };

  /**
   * Get feature by ID
   */
  const getFeature = (featureId: string): PremiumFeature | undefined => {
    return PREMIUM_FEATURES.find(feature => feature.id === featureId);
  };

  /**
   * Get features by category
   */
  const getFeaturesByCategory = (category: string): PremiumFeature[] => {
    return PREMIUM_FEATURES.filter(feature => feature.category === category);
  };

  /**
   * Get all premium features
   */
  const getAllFeatures = (): PremiumFeature[] => {
    return PREMIUM_FEATURES;
  };

  /**
   * Check if user needs upgrade for a specific action
   */
  const requiresUpgrade = (featureId: string): {
    required: boolean;
    feature?: PremiumFeature;
    reason?: string;
  } => {
    const feature = getFeature(featureId);
    
    if (!feature) {
      return { required: false };
    }

    if (hasFeature(featureId)) {
      return { required: false };
    }

    return {
      required: true,
      feature,
      reason: `${feature.name} é um recurso exclusivo para usuários Premium`,
    };
  };

  /**
   * Get usage status for a limit
   */
  const getUsageStatus = (action: keyof PremiumLimits, currentCount: number) => {
    const limit = limits[action];
    
    if (limit === -1) {
      return {
        used: currentCount,
        limit: -1,
        percentage: 0,
        isNearLimit: false,
        isAtLimit: false,
        remaining: -1,
      };
    }

    const percentage = limit > 0 ? (currentCount / limit) * 100 : 0;
    
    return {
      used: currentCount,
      limit,
      percentage,
      isNearLimit: percentage >= 80,
      isAtLimit: currentCount >= limit,
      remaining: Math.max(0, limit - currentCount),
    };
  };

  /**
   * Get user's plan information
   */
  const getPlanInfo = () => {
    if (!user) {
      return null;
    }

    return {
      isPremium: user.isPremium,
      subscriptionStatus: user.subscriptionStatus,
      planName: user.isPremium ? 'Premium' : 'Free',
      features: user.isPremium ? PREMIUM_FEATURES : [],
      limits: limits,
    };
  };

  /**
   * Get trial information
   */
  const getTrialInfo = () => {
    if (!user) {
      return null;
    }

    const isTrialing = user.subscriptionStatus === 'trialing';
    
    return {
      isTrialing,
      canStartTrial: !user.hasUsedTrial && !user.isPremium,
      hasUsedTrial: user.hasUsedTrial,
    };
  };

  return {
    // User status
    isPremium: user?.isPremium || false,
    subscriptionStatus: user?.subscriptionStatus,
    
    // Features
    hasFeature,
    getFeature,
    getFeaturesByCategory,
    getAllFeatures,
    requiresUpgrade,
    
    // Limits
    limits,
    canPerform,
    getUsageStatus,
    
    // Plan info
    getPlanInfo,
    getTrialInfo,
    
    // Constants
    PREMIUM_FEATURES,
    FREE_LIMITS,
    PREMIUM_LIMITS,
  };
};