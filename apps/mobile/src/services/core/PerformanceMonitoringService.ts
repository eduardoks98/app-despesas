/**
 * Performance Monitoring Service
 * 
 * Monitors app performance metrics and detects performance regressions
 */

import { AnalyticsService } from './AnalyticsService';
import { AlertingService } from './AlertingService';
import { SecureStorageService } from './SecureStorageService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface PerformanceSnapshot {
  timestamp: string;
  appStartTime: number;
  memoryUsage: number;
  frameRate: number;
  screenLoadTimes: Record<string, number>;
  apiResponseTimes: Record<string, number>;
  syncPerformance: {
    averageTime: number;
    lastSyncTime: number;
    throughput: number; // items per second
  };
  networkMetrics: {
    latency: number;
    bandwidth: number;
    errorRate: number;
  };
}

export interface PerformanceThresholds {
  appStartTime: number; // milliseconds
  memoryUsage: number; // MB
  screenLoadTime: number; // milliseconds
  apiResponseTime: number; // milliseconds
  frameRate: number; // FPS
  syncTime: number; // milliseconds
  networkLatency: number; // milliseconds
}

export interface PerformanceReport {
  summary: {
    overallScore: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor';
    criticalIssues: string[];
    recommendations: string[];
  };
  metrics: PerformanceSnapshot;
  trends: {
    improving: string[];
    degrading: string[];
    stable: string[];
  };
  comparisons: {
    previousSession: PerformanceSnapshot | null;
    baseline: PerformanceSnapshot | null;
  };
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private analytics: AnalyticsService;
  private alerting: AlertingService;
  private storage: SecureStorageService;
  
  private currentSnapshot: PerformanceSnapshot | null = null;
  private previousSnapshots: PerformanceSnapshot[] = [];
  private baseline: PerformanceSnapshot | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private frameRateMonitor: NodeJS.Timeout | null = null;
  
  private thresholds: PerformanceThresholds = {
    appStartTime: 3000, // 3 seconds
    memoryUsage: 100, // 100 MB
    screenLoadTime: 2000, // 2 seconds
    apiResponseTime: 5000, // 5 seconds
    frameRate: 30, // 30 FPS
    syncTime: 10000, // 10 seconds
    networkLatency: 1000 // 1 second
  };

  private frameCount = 0;
  private lastFrameTime = 0;
  private currentFrameRate = 60;

  private constructor() {
    this.analytics = AnalyticsService.getInstance();
    this.alerting = AlertingService.getInstance();
    this.storage = SecureStorageService.getInstance();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initialize performance monitoring
   */
  public async initialize(): Promise<void> {
    // Load baseline and previous snapshots
    await this.loadStoredData();
    
    // Start monitoring
    this.startMonitoring();
    this.startFrameRateMonitoring();
    
    // Take initial snapshot
    await this.takeSnapshot();
    
    logger.info('Performance monitoring initialized', {
      baseline: !!this.baseline,
      previousSnapshots: this.previousSnapshots.length
    });
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    // Take snapshots every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.takeSnapshot();
      await this.analyzePerformance();
    }, 30000);
  }

  /**
   * Start frame rate monitoring
   */
  private startFrameRateMonitoring(): void {
    if (typeof requestAnimationFrame === 'undefined') {
      // Fallback for environments without RAF
      this.currentFrameRate = 60;
      return;
    }

    const measureFrameRate = () => {
      const now = performance.now();
      
      if (this.lastFrameTime) {
        const delta = now - this.lastFrameTime;
        this.currentFrameRate = 1000 / delta;
        this.frameCount++;
        
        // Calculate average every 60 frames
        if (this.frameCount >= 60) {
          this.frameCount = 0;
        }
      }
      
      this.lastFrameTime = now;
      requestAnimationFrame(measureFrameRate);
    };

    measureFrameRate();
  }

  /**
   * Take performance snapshot
   */
  public async takeSnapshot(): Promise<PerformanceSnapshot> {
    const snapshot: PerformanceSnapshot = {
      timestamp: new Date().toISOString(),
      appStartTime: await this.getAppStartTime(),
      memoryUsage: await this.getMemoryUsage(),
      frameRate: this.currentFrameRate,
      screenLoadTimes: await this.getScreenLoadTimes(),
      apiResponseTimes: await this.getApiResponseTimes(),
      syncPerformance: await this.getSyncPerformance(),
      networkMetrics: await this.getNetworkMetrics()
    };

    this.currentSnapshot = snapshot;
    this.previousSnapshots.push(snapshot);
    
    // Keep only last 50 snapshots
    if (this.previousSnapshots.length > 50) {
      this.previousSnapshots = this.previousSnapshots.slice(-50);
    }
    
    // Set baseline if not exists
    if (!this.baseline) {
      this.baseline = { ...snapshot };
      await this.saveStoredData();
    }

    return snapshot;
  }

  /**
   * Analyze current performance against thresholds
   */
  private async analyzePerformance(): Promise<void> {
    if (!this.currentSnapshot) return;

    const issues: string[] = [];
    const alerts: Array<{ type: string; data: any }> = [];

    // Check app start time
    if (this.currentSnapshot.appStartTime > this.thresholds.appStartTime) {
      issues.push(`Slow app start: ${this.currentSnapshot.appStartTime}ms`);
      alerts.push({
        type: 'performance_degradation',
        data: {
          metric: 'appStartTime',
          value: this.currentSnapshot.appStartTime,
          threshold: this.thresholds.appStartTime
        }
      });
    }

    // Check memory usage
    if (this.currentSnapshot.memoryUsage > this.thresholds.memoryUsage) {
      issues.push(`High memory usage: ${this.currentSnapshot.memoryUsage}MB`);
      alerts.push({
        type: 'performance_degradation',
        data: {
          metric: 'memoryUsage',
          value: this.currentSnapshot.memoryUsage,
          threshold: this.thresholds.memoryUsage
        }
      });
    }

    // Check frame rate
    if (this.currentSnapshot.frameRate < this.thresholds.frameRate) {
      issues.push(`Low frame rate: ${this.currentSnapshot.frameRate.toFixed(1)} FPS`);
      alerts.push({
        type: 'performance_degradation',
        data: {
          metric: 'frameRate',
          value: this.currentSnapshot.frameRate,
          threshold: this.thresholds.frameRate
        }
      });
    }

    // Check screen load times
    const avgScreenLoadTime = this.calculateAverageScreenLoadTime();
    if (avgScreenLoadTime > this.thresholds.screenLoadTime) {
      issues.push(`Slow screen loads: ${avgScreenLoadTime}ms average`);
      alerts.push({
        type: 'performance_degradation',
        data: {
          metric: 'screenLoadTime',
          averageLoadTime: avgScreenLoadTime,
          threshold: this.thresholds.screenLoadTime
        }
      });
    }

    // Check API response times
    const avgApiResponseTime = this.calculateAverageApiResponseTime();
    if (avgApiResponseTime > this.thresholds.apiResponseTime) {
      issues.push(`Slow API responses: ${avgApiResponseTime}ms average`);
    }

    // Check sync performance
    if (this.currentSnapshot.syncPerformance.averageTime > this.thresholds.syncTime) {
      issues.push(`Slow sync: ${this.currentSnapshot.syncPerformance.averageTime}ms`);
    }

    // Trigger alerts if issues found
    for (const alert of alerts) {
      await this.alerting.checkRules('performance_degradation', alert.data);
    }

    // Track performance issues
    if (issues.length > 0) {
      await this.analytics.track('performance_issues_detected', {
        issueCount: issues.length,
        issues: issues.slice(0, 5), // Limit to prevent data bloat
        overallScore: this.calculatePerformanceScore()
      });
    }
  }

  /**
   * Generate comprehensive performance report
   */
  public async generateReport(): Promise<PerformanceReport> {
    if (!this.currentSnapshot) {
      await this.takeSnapshot();
    }

    const overallScore = this.calculatePerformanceScore();
    const status = this.getPerformanceStatus(overallScore);
    const criticalIssues = this.identifyCriticalIssues();
    const recommendations = this.generateRecommendations();
    const trends = this.analyzeTrends();

    const report: PerformanceReport = {
      summary: {
        overallScore,
        status,
        criticalIssues,
        recommendations
      },
      metrics: this.currentSnapshot!,
      trends,
      comparisons: {
        previousSession: this.getPreviousSession(),
        baseline: this.baseline
      }
    };

    // Track report generation
    await this.analytics.track('performance_report_generated', {
      overallScore,
      status,
      criticalIssueCount: criticalIssues.length,
      recommendationCount: recommendations.length
    });

    return report;
  }

  /**
   * Track specific performance metric
   */
  public async trackMetric(metricName: string, value: number, metadata?: Record<string, any>): Promise<void> {
    await this.analytics.track('performance_metric_tracked', {
      metricName,
      value,
      ...metadata
    });

    // Check if metric exceeds threshold
    const threshold = this.getThresholdForMetric(metricName);
    if (threshold && value > threshold) {
      await this.alerting.checkRules('performance_degradation', {
        metric: metricName,
        value,
        threshold
      });
    }
  }

  /**
   * Track screen transition performance
   */
  public async trackScreenTransition(fromScreen: string, toScreen: string, duration: number): Promise<void> {
    await this.analytics.track('screen_transition', {
      fromScreen,
      toScreen,
      duration
    });

    if (duration > 1000) { // More than 1 second
      await this.analytics.track('slow_screen_transition', {
        fromScreen,
        toScreen,
        duration
      });
    }
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(): number {
    if (!this.currentSnapshot) return 0;

    let score = 100;
    const penalties = {
      appStartTime: this.currentSnapshot.appStartTime > this.thresholds.appStartTime ? 20 : 0,
      memoryUsage: this.currentSnapshot.memoryUsage > this.thresholds.memoryUsage ? 15 : 0,
      frameRate: this.currentSnapshot.frameRate < this.thresholds.frameRate ? 25 : 0,
      screenLoadTime: this.calculateAverageScreenLoadTime() > this.thresholds.screenLoadTime ? 15 : 0,
      apiResponseTime: this.calculateAverageApiResponseTime() > this.thresholds.apiResponseTime ? 10 : 0,
      syncTime: this.currentSnapshot.syncPerformance.averageTime > this.thresholds.syncTime ? 10 : 0,
      networkLatency: this.currentSnapshot.networkMetrics.latency > this.thresholds.networkLatency ? 5 : 0
    };

    const totalPenalty = Object.values(penalties).reduce((sum, penalty) => sum + penalty, 0);
    return Math.max(0, score - totalPenalty);
  }

  /**
   * Get performance status based on score
   */
  private getPerformanceStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Identify critical performance issues
   */
  private identifyCriticalIssues(): string[] {
    if (!this.currentSnapshot) return [];

    const issues: string[] = [];

    if (this.currentSnapshot.appStartTime > this.thresholds.appStartTime * 2) {
      issues.push('App start time is severely degraded');
    }

    if (this.currentSnapshot.memoryUsage > this.thresholds.memoryUsage * 1.5) {
      issues.push('Memory usage is critically high');
    }

    if (this.currentSnapshot.frameRate < this.thresholds.frameRate * 0.5) {
      issues.push('Frame rate is severely low');
    }

    const avgScreenLoadTime = this.calculateAverageScreenLoadTime();
    if (avgScreenLoadTime > this.thresholds.screenLoadTime * 2) {
      issues.push('Screen load times are critically slow');
    }

    return issues;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    if (!this.currentSnapshot) return [];

    const recommendations: string[] = [];

    if (this.currentSnapshot.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('Consider optimizing memory usage by clearing unnecessary data');
    }

    if (this.currentSnapshot.frameRate < this.thresholds.frameRate) {
      recommendations.push('Optimize UI rendering and reduce heavy computations on main thread');
    }

    const avgScreenLoadTime = this.calculateAverageScreenLoadTime();
    if (avgScreenLoadTime > this.thresholds.screenLoadTime) {
      recommendations.push('Implement lazy loading and optimize screen initialization');
    }

    if (this.currentSnapshot.syncPerformance.averageTime > this.thresholds.syncTime) {
      recommendations.push('Optimize sync operations with incremental updates');
    }

    return recommendations;
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): {
    improving: string[];
    degrading: string[];
    stable: string[];
  } {
    const improving: string[] = [];
    const degrading: string[] = [];
    const stable: string[] = [];

    if (this.previousSnapshots.length < 2) {
      return { improving, degrading, stable };
    }

    const recent = this.previousSnapshots.slice(-5);
    const older = this.previousSnapshots.slice(-10, -5);

    if (recent.length === 0 || older.length === 0) {
      return { improving, degrading, stable };
    }

    // Calculate averages
    const recentAvg = this.calculateAverages(recent);
    const olderAvg = this.calculateAverages(older);

    // Compare trends
    const metrics = ['appStartTime', 'memoryUsage', 'frameRate'] as const;
    
    for (const metric of metrics) {
      const recentValue = recentAvg[metric];
      const olderValue = olderAvg[metric];
      const changePercent = ((recentValue - olderValue) / olderValue) * 100;

      if (Math.abs(changePercent) < 5) {
        stable.push(metric);
      } else if (metric === 'frameRate' ? changePercent > 5 : changePercent < -5) {
        improving.push(metric);
      } else {
        degrading.push(metric);
      }
    }

    return { improving, degrading, stable };
  }

  /**
   * Helper methods for data collection
   */
  private async getAppStartTime(): Promise<number> {
    // In real implementation, would measure actual app start time
    return this.analytics.getAnalyticsSummary().performance?.appStartTime || 0;
  }

  private async getMemoryUsage(): Promise<number> {
    // In real implementation, would use native memory APIs
    // For now, simulate based on app complexity
    return Math.random() * 50 + 30; // 30-80 MB
  }

  private async getScreenLoadTimes(): Promise<Record<string, number>> {
    const analytics = this.analytics.getAnalyticsSummary();
    return analytics.performance?.screenLoadTimes || {};
  }

  private async getApiResponseTimes(): Promise<Record<string, number>> {
    const analytics = this.analytics.getAnalyticsSummary();
    return analytics.performance?.apiResponseTimes || {};
  }

  private async getSyncPerformance(): Promise<PerformanceSnapshot['syncPerformance']> {
    const analytics = this.analytics.getAnalyticsSummary();
    const syncPerf = analytics.performance?.syncPerformance;
    
    return {
      averageTime: syncPerf?.averageTime || 0,
      lastSyncTime: 0, // Would track last sync time
      throughput: 0 // Would calculate items per second
    };
  }

  private async getNetworkMetrics(): Promise<PerformanceSnapshot['networkMetrics']> {
    // In real implementation, would measure network performance
    return {
      latency: Math.random() * 200 + 50, // 50-250ms
      bandwidth: Math.random() * 10 + 5, // 5-15 Mbps
      errorRate: Math.random() * 0.05 // 0-5% error rate
    };
  }

  private calculateAverageScreenLoadTime(): number {
    if (!this.currentSnapshot) return 0;
    const times = Object.values(this.currentSnapshot.screenLoadTimes);
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  private calculateAverageApiResponseTime(): number {
    if (!this.currentSnapshot) return 0;
    const times = Object.values(this.currentSnapshot.apiResponseTimes);
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }

  private calculateAverages(snapshots: PerformanceSnapshot[]): Record<string, number> {
    const sums = {
      appStartTime: 0,
      memoryUsage: 0,
      frameRate: 0
    };

    for (const snapshot of snapshots) {
      sums.appStartTime += snapshot.appStartTime;
      sums.memoryUsage += snapshot.memoryUsage;
      sums.frameRate += snapshot.frameRate;
    }

    return {
      appStartTime: sums.appStartTime / snapshots.length,
      memoryUsage: sums.memoryUsage / snapshots.length,
      frameRate: sums.frameRate / snapshots.length
    };
  }

  private getPreviousSession(): PerformanceSnapshot | null {
    return this.previousSnapshots.length > 1 ? this.previousSnapshots[this.previousSnapshots.length - 2] : null;
  }

  private getThresholdForMetric(metricName: string): number | null {
    const thresholdMap: Record<string, number> = {
      appStartTime: this.thresholds.appStartTime,
      memoryUsage: this.thresholds.memoryUsage,
      screenLoadTime: this.thresholds.screenLoadTime,
      apiResponseTime: this.thresholds.apiResponseTime,
      frameRate: this.thresholds.frameRate,
      syncTime: this.thresholds.syncTime,
      networkLatency: this.thresholds.networkLatency
    };

    return thresholdMap[metricName] || null;
  }

  /**
   * Storage operations
   */
  private async loadStoredData(): Promise<void> {
    try {
      const storedBaseline = await this.storage.getObject<PerformanceSnapshot>('performance_baseline' as any);
      const storedSnapshots = await this.storage.getObject<PerformanceSnapshot[]>('performance_snapshots' as any);

      if (storedBaseline) {
        this.baseline = storedBaseline;
      }

      if (storedSnapshots) {
        this.previousSnapshots = storedSnapshots;
      }
    } catch (error) {
      logger.error('Failed to load performance data', { error });
    }
  }

  private async saveStoredData(): Promise<void> {
    try {
      await Promise.all([
        this.storage.setObject('performance_baseline' as any, this.baseline),
        this.storage.setObject('performance_snapshots' as any, this.previousSnapshots.slice(-20)) // Keep last 20
      ]);
    } catch (error) {
      logger.error('Failed to save performance data', { error });
    }
  }

  /**
   * Update thresholds
   */
  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Performance thresholds updated', this.thresholds);
  }

  /**
   * Reset baseline
   */
  public async resetBaseline(): Promise<void> {
    if (this.currentSnapshot) {
      this.baseline = { ...this.currentSnapshot };
      await this.saveStoredData();
      logger.info('Performance baseline reset');
    }
  }

  /**
   * Export performance data
   */
  public async exportData(): Promise<string> {
    const data = {
      baseline: this.baseline,
      snapshots: this.previousSnapshots,
      thresholds: this.thresholds,
      currentSnapshot: this.currentSnapshot
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Cleanup on service destruction
   */
  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.frameRateMonitor) {
      clearInterval(this.frameRateMonitor);
    }

    this.saveStoredData();
    logger.info('Performance monitoring service destroyed');
  }
}