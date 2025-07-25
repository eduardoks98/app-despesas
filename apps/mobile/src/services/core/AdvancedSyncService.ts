/**
 * Advanced Sync Service - Enhanced version with intelligent conflict resolution,
 * incremental sync, and robust error handling
 * 
 * Combines all the advanced sync features into a unified service
 */

import { ConflictResolutionService } from './ConflictResolutionService';
import { IncrementalSyncService } from './IncrementalSyncService';
import { NetworkRetryService } from './NetworkRetryService';
import { SecureStorageService } from './SecureStorageService';
import { AuthenticationService } from './AuthenticationService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface AdvancedSyncConfig {
  apiUrl: string;
  syncInterval?: number; // minutes
  autoSync?: boolean;
  intelligentConflictResolution?: boolean;
  incrementalSync?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  compressionEnabled?: boolean;
  batchSize?: number;
}

export interface SyncMetrics {
  lastSyncTime?: Date;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  totalItemsSynced: number;
  totalConflictsResolved: number;
  totalBytesTransferred: number;
  compressionRatio?: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  lastError?: string;
  pendingItems: number;
  queuedOperations: number;
  networkStatus: 'excellent' | 'good' | 'poor' | 'offline';
}

export class AdvancedSyncService {
  private static instance: AdvancedSyncService;
  private conflictResolver: ConflictResolutionService;
  private incrementalSync: IncrementalSyncService;
  private networkRetry: NetworkRetryService;
  private secureStorage: SecureStorageService;
  private authService: AuthenticationService;
  
  private config: AdvancedSyncConfig = {
    apiUrl: '',
    syncInterval: 15,
    autoSync: true,
    intelligentConflictResolution: true,
    incrementalSync: true,
    maxRetries: 3,
    retryDelay: 1000,
    compressionEnabled: true,
    batchSize: 50
  };
  
  private status: SyncStatus = {
    isOnline: navigator?.onLine ?? true,
    isSyncing: false,
    pendingItems: 0,
    queuedOperations: 0,
    networkStatus: 'good'
  };
  
  private metrics: SyncMetrics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageSyncTime: 0,
    totalItemsSynced: 0,
    totalConflictsResolved: 0,
    totalBytesTransferred: 0
  };
  
  private listeners: ((status: SyncStatus) => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private operationQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  private constructor() {
    this.conflictResolver = ConflictResolutionService.getInstance();
    this.incrementalSync = IncrementalSyncService.getInstance();
    this.networkRetry = NetworkRetryService.getInstance();
    this.secureStorage = SecureStorageService.getInstance();
    this.authService = AuthenticationService.getInstance();
    
    this.setupNetworkListeners();
    this.startNetworkMonitoring();
  }

  public static getInstance(): AdvancedSyncService {
    if (!AdvancedSyncService.instance) {
      AdvancedSyncService.instance = new AdvancedSyncService();
    }
    return AdvancedSyncService.instance;
  }

  /**
   * Initialize the advanced sync service
   */
  public async initialize(config: Partial<AdvancedSyncConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Load stored metrics
    await this.loadMetrics();
    
    // Setup auto sync
    if (this.config.autoSync && this.config.syncInterval) {
      this.startAutoSync();
    }
    
    // Initial status update
    await this.updateStatus();
    
    logger.info('Advanced sync service initialized', {
      config: this.config,
      features: {
        intelligentConflicts: this.config.intelligentConflictResolution,
        incrementalSync: this.config.incrementalSync,
        compression: this.config.compressionEnabled
      }
    });
  }

  /**
   * Perform intelligent synchronization
   */
  public async sync(force: boolean = false): Promise<{
    success: boolean;
    itemsSynced: number;
    conflictsResolved: number;
    bytesTransferred: number;
    syncTime: number;
    error?: string;
  }> {
    if (this.status.isSyncing && !force) {
      throw new Error('Sync already in progress');
    }

    if (!this.status.isOnline) {
      throw new Error('Device is offline');
    }

    const syncStartTime = Date.now();
    this.status.isSyncing = true;
    this.notifyListeners();

    try {
      // Get auth token
      const authToken = await this.authService.getAccessToken();
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      let syncResult;

      if (this.config.incrementalSync) {
        // Use incremental sync for efficiency
        syncResult = await this.networkRetry.executeWithRetry(
          () => this.incrementalSync.performIncrementalSync(this.config.apiUrl, authToken),
          'incremental_sync',
          {
            maxRetries: this.config.maxRetries,
            initialDelay: this.config.retryDelay
          }
        );
      } else {
        // Fallback to full sync
        syncResult = await this.performFullSync(authToken);
      }

      const syncTime = Date.now() - syncStartTime;

      // Update metrics
      this.updateMetrics({
        syncTime,
        itemsSynced: syncResult.itemsSynced,
        conflictsResolved: syncResult.conflictsResolved,
        bytesTransferred: syncResult.bytesTransferred,
        success: syncResult.success
      });

      // Update status
      this.status.lastSync = new Date();
      this.status.lastError = undefined;
      this.status.isSyncing = false;
      await this.updateStatus();

      const result = {
        success: syncResult.success,
        itemsSynced: syncResult.itemsSynced,
        conflictsResolved: syncResult.conflictsResolved,
        bytesTransferred: syncResult.bytesTransferred,
        syncTime
      };

      logger.info('Sync completed successfully', result);
      return result;

    } catch (error: any) {
      const syncTime = Date.now() - syncStartTime;
      
      this.updateMetrics({
        syncTime,
        itemsSynced: 0,
        conflictsResolved: 0,
        bytesTransferred: 0,
        success: false
      });

      this.status.lastError = error.message;
      this.status.isSyncing = false;
      this.notifyListeners();

      logger.error('Sync failed', { error: error.message, syncTime });

      return {
        success: false,
        itemsSynced: 0,
        conflictsResolved: 0,
        bytesTransferred: 0,
        syncTime,
        error: error.message
      };
    }
  }

  /**
   * Queue operation for later sync
   */
  public async queueOperation(operation: () => Promise<void>): Promise<void> {
    this.operationQueue.push(operation);
    this.status.queuedOperations = this.operationQueue.length;
    this.notifyListeners();

    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      await this.processOperationQueue();
    }
  }

  /**
   * Process queued operations
   */
  private async processOperationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.operationQueue.length > 0) {
        const operation = this.operationQueue.shift();
        if (operation) {
          try {
            await operation();
          } catch (error) {
            logger.error('Queued operation failed', { error });
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
      this.status.queuedOperations = this.operationQueue.length;
      this.notifyListeners();
    }
  }

  /**
   * Perform full synchronization (fallback)
   */
  private async performFullSync(authToken: string): Promise<{
    success: boolean;
    itemsSynced: number;
    conflictsResolved: number;
    bytesTransferred: number;
  }> {
    // This would implement the full sync logic similar to the original SyncService
    // but with enhanced error handling and conflict resolution
    
    logger.info('Performing full synchronization');
    
    // Placeholder implementation
    return {
      success: true,
      itemsSynced: 0,
      conflictsResolved: 0,
      bytesTransferred: 0
    };
  }

  /**
   * Setup network status monitoring
   */
  private setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.status.isOnline = true;
        this.status.networkStatus = 'good';
        this.notifyListeners();
        
        // Auto-sync when coming back online
        if (this.config.autoSync) {
          this.sync().catch(error => {
            logger.error('Auto-sync on reconnect failed', { error });
          });
        }
      });

      window.addEventListener('offline', () => {
        this.status.isOnline = false;
        this.status.networkStatus = 'offline';
        this.notifyListeners();
      });
    }
  }

  /**
   * Monitor network quality
   */
  private startNetworkMonitoring(): void {
    setInterval(async () => {
      if (this.status.isOnline) {
        try {
          const startTime = Date.now();
          const response = await fetch(`${this.config.apiUrl}/health`, {
            method: 'HEAD',
            cache: 'no-cache'
          });
          const responseTime = Date.now() - startTime;

          if (response.ok) {
            if (responseTime < 500) {
              this.status.networkStatus = 'excellent';
            } else if (responseTime < 2000) {
              this.status.networkStatus = 'good';
            } else {
              this.status.networkStatus = 'poor';
            }
          } else {
            this.status.networkStatus = 'poor';
          }
        } catch {
          this.status.networkStatus = 'poor';
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const intervalMs = (this.config.syncInterval || 15) * 60 * 1000;
    
    this.syncInterval = setInterval(() => {
      if (this.status.isOnline && !this.status.isSyncing && this.status.networkStatus !== 'poor') {
        this.sync().catch(error => {
          logger.error('Auto-sync failed', { error });
        });
      }
    }, intervalMs);

    logger.info('Auto-sync started', { 
      interval: this.config.syncInterval,
      intervalMs 
    });
  }

  /**
   * Stop automatic synchronization
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Auto-sync stopped');
    }
  }

  /**
   * Update sync metrics
   */
  private updateMetrics(data: {
    syncTime: number;
    itemsSynced: number;
    conflictsResolved: number;
    bytesTransferred: number;
    success: boolean;
  }): void {
    this.metrics.totalSyncs++;
    
    if (data.success) {
      this.metrics.successfulSyncs++;
    } else {
      this.metrics.failedSyncs++;
    }
    
    // Update running averages
    const totalTime = this.metrics.averageSyncTime * (this.metrics.totalSyncs - 1) + data.syncTime;
    this.metrics.averageSyncTime = totalTime / this.metrics.totalSyncs;
    
    this.metrics.totalItemsSynced += data.itemsSynced;
    this.metrics.totalConflictsResolved += data.conflictsResolved;
    this.metrics.totalBytesTransferred += data.bytesTransferred;
    
    // Save metrics
    this.saveMetrics();
  }

  /**
   * Load metrics from storage
   */
  private async loadMetrics(): Promise<void> {
    try {
      const stored = await this.secureStorage.getObject<SyncMetrics>('sync_metrics' as any);
      if (stored) {
        this.metrics = { ...this.metrics, ...stored };
      }
    } catch (error) {
      logger.error('Failed to load sync metrics', { error });
    }
  }

  /**
   * Save metrics to storage
   */
  private async saveMetrics(): Promise<void> {
    try {
      await this.secureStorage.setObject('sync_metrics' as any, this.metrics);
    } catch (error) {
      logger.error('Failed to save sync metrics', { error });
    }
  }

  /**
   * Update sync status
   */
  private async updateStatus(): Promise<void> {
    // Get pending items count (placeholder)
    this.status.pendingItems = 0; // TODO: Implement actual count
    this.notifyListeners();
  }

  /**
   * Add status listener
   */
  public addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.status });
      } catch (error) {
        logger.error('Status listener error', { error });
      }
    });
  }

  /**
   * Get current status
   */
  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Get sync metrics
   */
  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  public async resetMetrics(): Promise<void> {
    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      averageSyncTime: 0,
      totalItemsSynced: 0,
      totalConflictsResolved: 0,
      totalBytesTransferred: 0
    };
    
    await this.saveMetrics();
    logger.info('Sync metrics reset');
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AdvancedSyncConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };
    
    // Restart auto-sync if interval changed
    if (oldConfig.syncInterval !== this.config.syncInterval || 
        oldConfig.autoSync !== this.config.autoSync) {
      this.stopAutoSync();
      if (this.config.autoSync) {
        this.startAutoSync();
      }
    }
    
    logger.info('Sync configuration updated', { 
      old: oldConfig, 
      new: this.config 
    });
  }

  /**
   * Force full resync (clear local sync state)
   */
  public async forceFullResync(): Promise<void> {
    await this.incrementalSync.clearSyncMetadata();
    await this.secureStorage.updateLastSyncTime(new Date(0).toISOString());
    
    logger.info('Full resync forced - sync metadata cleared');
  }

  /**
   * Cleanup and destroy service
   */
  public destroy(): void {
    this.stopAutoSync();
    this.listeners = [];
    this.operationQueue = [];
    this.networkRetry.reset();
    
    logger.info('Advanced sync service destroyed');
  }
}