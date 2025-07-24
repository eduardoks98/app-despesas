import { Platform } from 'react-native';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface AnalyticsUser {
  id?: string;
  properties?: Record<string, any>;
}

export class AnalyticsService {
  private static isEnabled: boolean = false;
  private static userId: string | null = null;
  private static events: AnalyticsEvent[] = [];

  // Inicializar analytics
  static async initialize(): Promise<void> {
    try {
      // Verificar se analytics está habilitado
      this.isEnabled = process.env.ANALYTICS_ENABLED === 'true';
      
      if (!this.isEnabled) {
        console.log('[AnalyticsService] Analytics disabled');
        return;
      }

      console.log('[AnalyticsService] Analytics initialized');
    } catch (error) {
      console.error('[AnalyticsService] Failed to initialize:', error);
    }
  }

  // Identificar usuário
  static identifyUser(userId: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.userId = userId;
    console.log('[AnalyticsService] User identified:', userId);
  }

  // Registrar evento
  static trackEvent(name: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        platform: Platform.OS,
        timestamp: Date.now(),
        userId: this.userId,
      },
      timestamp: Date.now(),
    };

    this.events.push(event);
    console.log('[AnalyticsService] Event tracked:', name, properties);
  }

  // Eventos específicos do app
  static trackExpenseAdded(amount: number, category: string): void {
    this.trackEvent('expense_added', {
      amount,
      category,
      type: 'expense',
    });
  }

  static trackIncomeAdded(amount: number, category: string): void {
    this.trackEvent('income_added', {
      amount,
      category,
      type: 'income',
    });
  }

  static trackInstallmentCreated(totalAmount: number, installments: number): void {
    this.trackEvent('installment_created', {
      totalAmount,
      installments,
      type: 'installment',
    });
  }

  static trackSubscriptionCreated(amount: number, frequency: string): void {
    this.trackEvent('subscription_created', {
      amount,
      frequency,
      type: 'subscription',
    });
  }

  static trackReportGenerated(reportType: string): void {
    this.trackEvent('report_generated', {
      reportType,
      type: 'report',
    });
  }

  static trackExportPerformed(format: string): void {
    this.trackEvent('export_performed', {
      format,
      type: 'export',
    });
  }

  static trackScreenView(screenName: string): void {
    this.trackEvent('screen_view', {
      screenName,
      type: 'navigation',
    });
  }

  static trackFeatureUsed(featureName: string): void {
    this.trackEvent('feature_used', {
      featureName,
      type: 'feature',
    });
  }

  // Obter eventos registrados (para debug)
  static getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Limpar eventos (para debug)
  static clearEvents(): void {
    this.events = [];
  }

  // Verificar se está habilitado
  static isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }
} 