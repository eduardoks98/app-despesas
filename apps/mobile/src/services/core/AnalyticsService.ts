/**
 * Analytics Service
 * 
 * Comprehensive analytics and usage tracking service
 * Handles user behavior, performance metrics, and business intelligence
 */

import { SecureStorageService } from './SecureStorageService';
import { AuthenticationService } from './AuthenticationService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  deviceId: string;
  timestamp: string;
  eventType: string;
  eventName: string;
  properties: Record<string, any>;
  context: AnalyticsContext;
}

export interface AnalyticsContext {
  app: {
    name: string;
    version: string;
    buildNumber: string;
  };
  device: {
    platform: string;
    os: string;
    model: string;
    screenResolution: string;
  };
  network: {
    type: string;
    quality: 'excellent' | 'good' | 'poor' | 'offline';
  };
  user: {
    isPremium: boolean;
    accountAge: number; // days since registration
    totalTransactions: number;
  };
}

export interface UserBehaviorMetrics {
  sessionDuration: number;
  screenViews: Record<string, number>;
  featureUsage: Record<string, number>;
  errorEncounters: number;
  crashCount: number;
  syncFrequency: number;
  offlineUsage: number;
}

export interface PerformanceMetrics {
  appStartTime: number;
  screenLoadTimes: Record<string, number[]>;
  apiResponseTimes: Record<string, number[]>;
  syncPerformance: {
    averageTime: number;
    successRate: number;
    dataTransferred: number;
  };
  memoryUsage: number[];
  batteryImpact: number;
}

export interface BusinessMetrics {
  transactionVolume: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  categoryUsage: Record<string, number>;
  premiumFeatureUsage: Record<string, number>;
  retentionMetrics: {
    day1: number;
    day7: number;
    day30: number;
  };
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private storage: SecureStorageService;
  private auth: AuthenticationService;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionStartTime: number;
  private isFlushingQueue = false;
  private flushInterval: NodeJS.Timeout | null = null;

  private userBehavior: UserBehaviorMetrics = {
    sessionDuration: 0,
    screenViews: {},
    featureUsage: {},
    errorEncounters: 0,
    crashCount: 0,
    syncFrequency: 0,
    offlineUsage: 0
  };

  private performance: PerformanceMetrics = {
    appStartTime: 0,
    screenLoadTimes: {},
    apiResponseTimes: {},
    syncPerformance: {
      averageTime: 0,
      successRate: 0,
      dataTransferred: 0
    },
    memoryUsage: [],
    batteryImpact: 0
  };

  private business: BusinessMetrics = {
    transactionVolume: {
      daily: 0,
      weekly: 0,
      monthly: 0
    },
    categoryUsage: {},
    premiumFeatureUsage: {},
    retentionMetrics: {
      day1: 0,
      day7: 0,
      day30: 0
    }
  };

  private constructor() {
    this.storage = SecureStorageService.getInstance();
    this.auth = AuthenticationService.getInstance();
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    this.setupAutoFlush();
    this.loadStoredMetrics();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize analytics service
   */
  public async initialize(): Promise<void> {
    this.performance.appStartTime = Date.now() - this.sessionStartTime;
    
    // Track app start event
    await this.track('app_started', {
      startTime: this.performance.appStartTime,
      isFirstLaunch: await this.isFirstLaunch(),
      previousCrash: await this.hadPreviousCrash()
    });

    // Load user context
    await this.updateUserContext();
    
    logger.info('Analytics service initialized', {
      sessionId: this.sessionId,
      appStartTime: this.performance.appStartTime
    });
  }

  /**
   * Track analytics event
   */
  public async track(eventName: string, properties: Record<string, any> = {}): Promise<void> {
    try {
      const user = await this.auth.getCurrentUser();
      const context = await this.getAnalyticsContext();
      
      const event: AnalyticsEvent = {
        id: this.generateEventId(),
        userId: user?.id,
        sessionId: this.sessionId,
        deviceId: await this.storage.getDeviceId(),
        timestamp: new Date().toISOString(),
        eventType: this.getEventType(eventName),
        eventName,
        properties: {
          ...properties,
          sessionDuration: Date.now() - this.sessionStartTime
        },
        context
      };

      // Add to queue
      this.eventQueue.push(event);
      
      // Update local metrics
      this.updateLocalMetrics(event);
      
      logger.debug('Analytics event tracked', {
        eventName,
        queueSize: this.eventQueue.length
      });

      // Flush queue if it's getting large
      if (this.eventQueue.length >= 50) {
        await this.flushQueue();
      }

    } catch (error) {
      logger.error('Failed to track analytics event', { eventName, error });
    }
  }

  /**
   * Track screen view
   */
  public async trackScreenView(screenName: string, properties: Record<string, any> = {}): Promise<void> {
    const startTime = Date.now();
    
    await this.track('screen_view', {
      screenName,
      loadTime: 0, // Will be updated when screen is fully loaded
      ...properties
    });

    // Update screen view count
    this.userBehavior.screenViews[screenName] = (this.userBehavior.screenViews[screenName] || 0) + 1;
    
    // Store start time for load time calculation
    const key = `screen_load_${screenName}`;
    await this.storage.setItem(key as any, startTime.toString());
  }

  /**
   * Track screen load completion
   */
  public async trackScreenLoadComplete(screenName: string): Promise<void> {
    try {
      const key = `screen_load_${screenName}`;
      const startTimeStr = await this.storage.getItem(key as any);
      
      if (startTimeStr) {
        const startTime = parseInt(startTimeStr);
        const loadTime = Date.now() - startTime;
        
        // Update performance metrics
        if (!this.performance.screenLoadTimes[screenName]) {
          this.performance.screenLoadTimes[screenName] = [];
        }
        this.performance.screenLoadTimes[screenName].push(loadTime);
        
        await this.track('screen_load_complete', {
          screenName,
          loadTime
        });
        
        // Clean up
        await this.storage.removeItem(key as any);
      }
    } catch (error) {
      logger.error('Failed to track screen load completion', { screenName, error });
    }
  }

  /**
   * Track feature usage
   */
  public async trackFeatureUsage(featureName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.track('feature_used', {
      featureName,
      ...properties
    });

    // Update feature usage count
    this.userBehavior.featureUsage[featureName] = (this.userBehavior.featureUsage[featureName] || 0) + 1;
  }

  /**
   * Track error occurrence
   */
  public async trackError(error: Error, context: Record<string, any> = {}): Promise<void> {
    this.userBehavior.errorEncounters++;
    
    await this.track('error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      ...context
    });
  }

  /**
   * Track transaction creation
   */
  public async trackTransaction(type: 'income' | 'expense', amount: number, categoryId: string): Promise<void> {
    await this.track('transaction_created', {
      type,
      amount,
      categoryId
    });

    // Update business metrics
    this.business.transactionVolume.daily++;
    this.business.categoryUsage[categoryId] = (this.business.categoryUsage[categoryId] || 0) + 1;
  }

  /**
   * Track sync operation
   */
  public async trackSync(duration: number, itemsSynced: number, success: boolean): Promise<void> {
    await this.track('sync_completed', {
      duration,
      itemsSynced,
      success
    });

    // Update sync performance
    const current = this.performance.syncPerformance;
    current.averageTime = (current.averageTime + duration) / 2;
    current.dataTransferred += itemsSynced;
    
    this.userBehavior.syncFrequency++;
  }

  /**
   * Track premium feature usage
   */
  public async trackPremiumFeature(featureName: string, properties: Record<string, any> = {}): Promise<void> {
    await this.track('premium_feature_used', {
      featureName,
      ...properties
    });

    this.business.premiumFeatureUsage[featureName] = (this.business.premiumFeatureUsage[featureName] || 0) + 1;
  }

  /**
   * Track API response time
   */
  public async trackApiResponse(endpoint: string, duration: number, success: boolean): Promise<void> {
    if (!this.performance.apiResponseTimes[endpoint]) {
      this.performance.apiResponseTimes[endpoint] = [];
    }
    this.performance.apiResponseTimes[endpoint].push(duration);

    await this.track('api_response', {
      endpoint,
      duration,
      success
    });
  }

  /**
   * Get analytics context
   */
  private async getAnalyticsContext(): Promise<AnalyticsContext> {
    const user = await this.auth.getCurrentUser();
    const deviceInfo = await this.getDeviceInfo();
    
    return {
      app: {
        name: 'App Despesas',
        version: '1.0.0', // Should come from app config
        buildNumber: '1'  // Should come from app config
      },
      device: deviceInfo,
      network: {
        type: 'wifi', // Would be detected in real implementation
        quality: 'good' // Would be detected from network monitoring
      },
      user: {
        isPremium: user?.isPremium || false,
        accountAge: user ? this.calculateAccountAge(user.createdAt) : 0,
        totalTransactions: await this.getTotalTransactionCount()
      }
    };
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<AnalyticsContext['device']> {
    // In real implementation, would use Expo Device API
    return {
      platform: 'mobile',
      os: 'ios', // or 'android'
      model: 'unknown',
      screenResolution: '375x812'
    };
  }

  /**
   * Update local metrics based on event
   */
  private updateLocalMetrics(event: AnalyticsEvent): void {
    this.userBehavior.sessionDuration = Date.now() - this.sessionStartTime;

    // Update specific metrics based on event type
    switch (event.eventName) {
      case 'error_occurred':
        this.userBehavior.errorEncounters++;
        break;
      case 'offline_usage':
        this.userBehavior.offlineUsage++;
        break;
    }
  }

  /**
   * Flush event queue to server
   */
  public async flushQueue(): Promise<void> {
    if (this.isFlushingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.isFlushingQueue = true;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // In a real implementation, this would send to analytics server
      await this.sendEventsToServer(events);
      
      logger.info('Analytics events flushed', { count: events.length });

    } catch (error) {
      logger.error('Failed to flush analytics events', { error });
      // Re-queue events on failure
      this.eventQueue.unshift(...this.eventQueue);
    } finally {
      this.isFlushingQueue = false;
    }
  }

  /**
   * Send events to analytics server
   */
  private async sendEventsToServer(events: AnalyticsEvent[]): Promise<void> {
    // Placeholder for server integration
    // In real implementation, would use analytics service like Mixpanel, Amplitude, etc.
    
    const authToken = await this.auth.getAccessToken();
    if (!authToken) {
      throw new Error('No auth token available');
    }

    // Simulate API call
    logger.debug('Would send analytics events to server', {
      eventCount: events.length,
      sampleEvent: events[0]?.eventName
    });
  }

  /**
   * Setup automatic queue flushing
   */
  private setupAutoFlush(): void {
    // Flush every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushQueue().catch(error => {
        logger.error('Auto-flush failed', { error });
      });
    }, 30000);

    // Flush on app background/close
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushQueue();
      });
    }
  }

  /**
   * Load stored metrics
   */
  private async loadStoredMetrics(): Promise<void> {
    try {
      const storedBehavior = await this.storage.getObject<UserBehaviorMetrics>('analytics_behavior' as any);
      const storedPerformance = await this.storage.getObject<PerformanceMetrics>('analytics_performance' as any);
      const storedBusiness = await this.storage.getObject<BusinessMetrics>('analytics_business' as any);

      if (storedBehavior) {
        this.userBehavior = { ...this.userBehavior, ...storedBehavior };
      }
      if (storedPerformance) {
        this.performance = { ...this.performance, ...storedPerformance };
      }
      if (storedBusiness) {
        this.business = { ...this.business, ...storedBusiness };
      }
    } catch (error) {
      logger.error('Failed to load stored metrics', { error });
    }
  }

  /**
   * Save metrics to storage
   */
  private async saveMetrics(): Promise<void> {
    try {
      await Promise.all([
        this.storage.setObject('analytics_behavior' as any, this.userBehavior),
        this.storage.setObject('analytics_performance' as any, this.performance),
        this.storage.setObject('analytics_business' as any, this.business)
      ]);
    } catch (error) {
      logger.error('Failed to save metrics', { error });
    }
  }

  /**
   * Get comprehensive analytics summary
   */
  public getAnalyticsSummary(): {
    userBehavior: UserBehaviorMetrics;
    performance: PerformanceMetrics;
    business: BusinessMetrics;
    session: {
      id: string;
      duration: number;
      eventsTracked: number;
    };
  } {
    return {
      userBehavior: { ...this.userBehavior },
      performance: { ...this.performance },
      business: { ...this.business },
      session: {
        id: this.sessionId,
        duration: Date.now() - this.sessionStartTime,
        eventsTracked: this.eventQueue.length
      }
    };
  }

  /**
   * Export analytics data for debugging
   */
  public async exportAnalyticsData(): Promise<string> {
    const data = {
      summary: this.getAnalyticsSummary(),
      queuedEvents: this.eventQueue,
      context: await this.getAnalyticsContext()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all analytics data
   */
  public async clearAnalyticsData(): Promise<void> {
    this.eventQueue = [];
    this.userBehavior = {
      sessionDuration: 0,
      screenViews: {},
      featureUsage: {},
      errorEncounters: 0,
      crashCount: 0,
      syncFrequency: 0,
      offlineUsage: 0
    };

    await this.storage.removeItem('analytics_behavior' as any);
    await this.storage.removeItem('analytics_performance' as any);
    await this.storage.removeItem('analytics_business' as any);

    logger.info('Analytics data cleared');
  }

  /**
   * Update user context
   */
  private async updateUserContext(): Promise<void> {
    // Update any user-specific context information
    // This would be called when user data changes
  }

  /**
   * Helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEventType(eventName: string): string {
    if (eventName.includes('screen')) return 'navigation';
    if (eventName.includes('transaction')) return 'business';
    if (eventName.includes('sync')) return 'sync';
    if (eventName.includes('error')) return 'error';
    if (eventName.includes('feature')) return 'feature';
    return 'general';
  }

  private async isFirstLaunch(): Promise<boolean> {
    const hasLaunched = await this.storage.hasItem('has_launched_before' as any);
    if (!hasLaunched) {
      await this.storage.setItem('has_launched_before' as any, 'true');
      return true;
    }
    return false;
  }

  private async hadPreviousCrash(): Promise<boolean> {
    // Would check for crash reports from previous session
    return false;
  }

  private calculateAccountAge(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private async getTotalTransactionCount(): Promise<number> {
    // Would query local database for transaction count
    return 0;
  }

  /**
   * Cleanup on service destruction
   */
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Final flush before destruction
    this.flushQueue().then(() => {
      this.saveMetrics();
    });

    logger.info('Analytics service destroyed');
  }
}