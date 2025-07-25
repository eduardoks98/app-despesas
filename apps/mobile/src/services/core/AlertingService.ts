/**
 * Alerting Service
 * 
 * Handles intelligent alerting and notification system for failures and important events
 */

import { AnalyticsService } from './AnalyticsService';
import { SecureStorageService } from './SecureStorageService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  data?: Record<string, any>;
  acknowledged: boolean;
  autoResolve: boolean;
  resolvedAt?: string;
}

export type AlertType = 
  | 'sync_failure'
  | 'auth_failure' 
  | 'network_error'
  | 'performance_degradation'
  | 'storage_error'
  | 'payment_failure'
  | 'security_incident'
  | 'app_crash'
  | 'business_metric'
  | 'user_behavior';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  condition: (data: any) => boolean;
  severity: AlertSeverity;
  cooldownPeriod: number; // milliseconds
  autoResolve: boolean;
  enabled: boolean;
}

export interface AlertingConfig {
  maxAlertsInMemory: number;
  persistAlerts: boolean;
  enableUserNotifications: boolean;
  enableAnalyticsReporting: boolean;
  defaultCooldown: number;
}

export class AlertingService {
  private static instance: AlertingService;
  private storage: SecureStorageService;
  private analytics: AnalyticsService;
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private listeners: Array<(alert: Alert) => void> = [];

  private config: AlertingConfig = {
    maxAlertsInMemory: 100,
    persistAlerts: true,
    enableUserNotifications: true,
    enableAnalyticsReporting: true,
    defaultCooldown: 300000 // 5 minutes
  };

  private constructor() {
    this.storage = SecureStorageService.getInstance();
    this.analytics = AnalyticsService.getInstance();
    this.initializeDefaultRules();
  }

  public static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  /**
   * Initialize alerting service
   */
  public async initialize(config?: Partial<AlertingConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Load persisted alerts
    if (this.config.persistAlerts) {
      await this.loadPersistedAlerts();
    }

    // Setup auto-cleanup
    this.setupAutoCleanup();

    logger.info('Alerting service initialized', {
      rulesCount: this.rules.size,
      alertsCount: this.alerts.size,
      config: this.config
    });
  }

  /**
   * Initialize default alerting rules
   */
  private initializeDefaultRules(): void {
    // Sync failure rule
    this.addRule({
      id: 'sync_consecutive_failures',
      name: 'Consecutive Sync Failures',
      type: 'sync_failure',
      condition: (data) => data.consecutiveFailures >= 3,
      severity: 'high',
      cooldownPeriod: 600000, // 10 minutes
      autoResolve: true,
      enabled: true
    });

    // Network error rule
    this.addRule({
      id: 'network_extended_offline',
      name: 'Extended Offline Period',
      type: 'network_error',
      condition: (data) => data.offlineDuration > 3600000, // 1 hour
      severity: 'medium',
      cooldownPeriod: 1800000, // 30 minutes
      autoResolve: true,
      enabled: true
    });

    // Performance degradation rule
    this.addRule({
      id: 'performance_slow_screens',
      name: 'Slow Screen Load Times',
      type: 'performance_degradation',
      condition: (data) => data.averageLoadTime > 5000, // 5 seconds
      severity: 'medium',
      cooldownPeriod: 900000, // 15 minutes
      autoResolve: false,
      enabled: true
    });

    // Auth failure rule
    this.addRule({
      id: 'auth_repeated_failures',
      name: 'Repeated Authentication Failures',
      type: 'auth_failure',
      condition: (data) => data.failureCount >= 5,
      severity: 'high',
      cooldownPeriod: 300000, // 5 minutes
      autoResolve: true,
      enabled: true
    });

    // Storage error rule
    this.addRule({
      id: 'storage_quota_exceeded',
      name: 'Storage Quota Exceeded',
      type: 'storage_error',
      condition: (data) => data.usagePercentage > 90,
      severity: 'high',
      cooldownPeriod: 3600000, // 1 hour
      autoResolve: false,
      enabled: true
    });

    // App crash rule
    this.addRule({
      id: 'app_crash_detected',
      name: 'Application Crash Detected',
      type: 'app_crash',
      condition: (data) => data.crashDetected === true,
      severity: 'critical',
      cooldownPeriod: 0, // No cooldown for crashes
      autoResolve: false,
      enabled: true
    });

    // Business metric rule
    this.addRule({
      id: 'transaction_volume_drop',
      name: 'Transaction Volume Drop',
      type: 'business_metric',
      condition: (data) => data.volumeDropPercentage > 50,
      severity: 'medium',
      cooldownPeriod: 86400000, // 24 hours
      autoResolve: true,
      enabled: true
    });
  }

  /**
   * Add alerting rule
   */
  public addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.debug('Alert rule added', { ruleId: rule.id, ruleName: rule.name });
  }

  /**
   * Remove alerting rule
   */
  public removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      logger.debug('Alert rule removed', { ruleId });
    }
    return removed;
  }

  /**
   * Check data against all rules and trigger alerts
   */
  public async checkRules(type: AlertType, data: any): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (rule.type === type && rule.enabled) {
        try {
          if (rule.condition(data) && !this.isInCooldown(rule.id)) {
            const alert = await this.triggerAlert(rule, data);
            triggeredAlerts.push(alert);
          }
        } catch (error) {
          logger.error('Error checking alert rule', { 
            ruleId: rule.id, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Trigger an alert
   */
  public async triggerAlert(rule: AlertRule, data?: any): Promise<Alert> {
    const alert: Alert = {
      id: this.generateAlertId(),
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      message: this.generateAlertMessage(rule, data),
      timestamp: new Date().toISOString(),
      data,
      acknowledged: false,
      autoResolve: rule.autoResolve
    };

    // Store alert
    this.alerts.set(alert.id, alert);
    
    // Set cooldown
    if (rule.cooldownPeriod > 0) {
      this.cooldowns.set(rule.id, Date.now() + rule.cooldownPeriod);
    }

    // Notify listeners
    this.notifyListeners(alert);

    // Track in analytics
    if (this.config.enableAnalyticsReporting) {
      await this.analytics.track('alert_triggered', {
        alertId: alert.id,
        alertType: alert.type,
        severity: alert.severity,
        ruleId: rule.id
      });
    }

    // Persist if configured
    if (this.config.persistAlerts) {
      await this.persistAlert(alert);
    }

    // Handle memory limit
    await this.enforceMemoryLimit();

    logger.warn('Alert triggered', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title
    });

    return alert;
  }

  /**
   * Acknowledge an alert
   */
  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    
    // Track acknowledgment
    await this.analytics.track('alert_acknowledged', {
      alertId,
      type: alert.type,
      severity: alert.severity
    });

    logger.info('Alert acknowledged', { alertId, type: alert.type });
    return true;
  }

  /**
   * Resolve an alert
   */
  public async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolvedAt = new Date().toISOString();
    
    // Track resolution
    await this.analytics.track('alert_resolved', {
      alertId,
      type: alert.type,
      severity: alert.severity,
      timeToResolve: Date.now() - new Date(alert.timestamp).getTime()
    });

    logger.info('Alert resolved', { alertId, type: alert.type });
    return true;
  }

  /**
   * Get all active alerts
   */
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolvedAt)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get alerts by type
   */
  public getAlertsByType(type: AlertType): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get alerts by severity
   */
  public getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.severity === severity)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Add alert listener
   */
  public addListener(listener: (alert: Alert) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get alerting statistics
   */
  public getStatistics(): {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    acknowledgedAlerts: number;
    alertsByType: Record<AlertType, number>;
    alertsBySeverity: Record<AlertSeverity, number>;
    averageResolutionTime: number;
  } {
    const alerts = Array.from(this.alerts.values());
    
    const alertsByType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);
    
    const alertsBySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);
    
    const resolvedAlerts = alerts.filter(a => a.resolvedAt);
    const resolutionTimes = resolvedAlerts.map(a => 
      new Date(a.resolvedAt!).getTime() - new Date(a.timestamp).getTime()
    );
    const averageResolutionTime = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;

    return {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => !a.resolvedAt).length,
      resolvedAlerts: resolvedAlerts.length,
      acknowledgedAlerts: alerts.filter(a => a.acknowledged).length,
      alertsByType,
      alertsBySeverity,
      averageResolutionTime
    };
  }

  /**
   * Utility methods
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertMessage(rule: AlertRule, data?: any): string {
    switch (rule.type) {
      case 'sync_failure':
        return `Sync has failed ${data?.consecutiveFailures || 'multiple'} times consecutively`;
      case 'network_error':
        return `Device has been offline for ${Math.round((data?.offlineDuration || 0) / 60000)} minutes`;
      case 'performance_degradation':
        return `Average screen load time is ${data?.averageLoadTime || 'unknown'}ms`;
      case 'auth_failure':
        return `${data?.failureCount || 'Multiple'} authentication failures detected`;
      case 'storage_error':
        return `Storage usage at ${data?.usagePercentage || 'high'}%`;
      case 'app_crash':
        return 'Application crash detected during previous session';
      case 'business_metric':
        return `Transaction volume dropped by ${data?.volumeDropPercentage || 'significant'}%`;
      default:
        return `Alert triggered: ${rule.name}`;
    }
  }

  private isInCooldown(ruleId: string): boolean {
    const cooldownEnd = this.cooldowns.get(ruleId);
    if (!cooldownEnd) {
      return false;
    }
    
    if (Date.now() > cooldownEnd) {
      this.cooldowns.delete(ruleId);
      return false;
    }
    
    return true;
  }

  private notifyListeners(alert: Alert): void {
    this.listeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        logger.error('Alert listener error', { error });
      }
    });
  }

  private async persistAlert(alert: Alert): Promise<void> {
    try {
      const alertsKey = 'persisted_alerts' as any;
      const existingAlerts = await this.storage.getObject<Alert[]>(alertsKey) || [];
      existingAlerts.push(alert);
      
      // Keep only last 50 alerts
      const recentAlerts = existingAlerts.slice(-50);
      await this.storage.setObject(alertsKey, recentAlerts);
    } catch (error) {
      logger.error('Failed to persist alert', { alertId: alert.id, error });
    }
  }

  private async loadPersistedAlerts(): Promise<void> {
    try {
      const alertsKey = 'persisted_alerts' as any;
      const persistedAlerts = await this.storage.getObject<Alert[]>(alertsKey);
      
      if (persistedAlerts) {
        persistedAlerts.forEach(alert => {
          this.alerts.set(alert.id, alert);
        });
        
        logger.info('Loaded persisted alerts', { count: persistedAlerts.length });
      }
    } catch (error) {
      logger.error('Failed to load persisted alerts', { error });
    }
  }

  private async enforceMemoryLimit(): Promise<void> {
    if (this.alerts.size <= this.config.maxAlertsInMemory) {
      return;
    }

    // Remove oldest resolved alerts first
    const alerts = Array.from(this.alerts.entries())
      .filter(([, alert]) => alert.resolvedAt)
      .sort(([, a], [, b]) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const toRemove = this.alerts.size - this.config.maxAlertsInMemory;
    for (let i = 0; i < Math.min(toRemove, alerts.length); i++) {
      this.alerts.delete(alerts[i][0]);
    }

    logger.debug('Enforced alert memory limit', {
      removed: Math.min(toRemove, alerts.length),
      remaining: this.alerts.size
    });
  }

  private setupAutoCleanup(): void {
    // Clean up resolved alerts older than 7 days
    setInterval(() => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      let removedCount = 0;

      for (const [id, alert] of this.alerts.entries()) {
        if (alert.resolvedAt && new Date(alert.resolvedAt).getTime() < sevenDaysAgo) {
          this.alerts.delete(id);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        logger.info('Auto-cleanup completed', { removedAlerts: removedCount });
      }
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  /**
   * Clear all alerts
   */
  public async clearAllAlerts(): Promise<void> {
    this.alerts.clear();
    this.cooldowns.clear();
    
    if (this.config.persistAlerts) {
      await this.storage.removeItem('persisted_alerts' as any);
    }
    
    logger.info('All alerts cleared');
  }

  /**
   * Export alerts for debugging
   */
  public exportAlerts(): string {
    const data = {
      alerts: Array.from(this.alerts.values()),
      rules: Array.from(this.rules.values()),
      statistics: this.getStatistics(),
      config: this.config
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Cleanup on service destruction
   */
  public destroy(): void {
    this.listeners = [];
    logger.info('Alerting service destroyed');
  }
}