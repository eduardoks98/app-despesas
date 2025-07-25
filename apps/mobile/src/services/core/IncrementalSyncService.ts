/**
 * Incremental Sync Service
 * 
 * Handles efficient incremental synchronization to reduce bandwidth and improve performance
 */

import { SecureStorageService } from './SecureStorageService';
import { ConflictResolutionService } from './ConflictResolutionService';
import { Transaction, Category } from '../../types';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface SyncMetadata {
  entityType: 'transaction' | 'category';
  entityId: string;
  lastModified: string;
  checksum: string;
  action: 'create' | 'update' | 'delete';
  deviceId: string;
}

export interface DeltaSync {
  since: string;
  transactions: {
    created: Transaction[];
    updated: Transaction[];
    deleted: string[];
  };
  categories: {
    created: Category[];
    updated: Category[];
    deleted: string[];
  };
  serverTimestamp: string;
}

export interface SyncDelta {
  entityType: 'transaction' | 'category';
  action: 'create' | 'update' | 'delete';
  data?: any;
  entityId: string;
  timestamp: string;
  checksum: string;
}

export class IncrementalSyncService {
  private static instance: IncrementalSyncService;
  private storage: SecureStorageService;
  private conflictResolver: ConflictResolutionService;

  private constructor() {
    this.storage = SecureStorageService.getInstance();
    this.conflictResolver = ConflictResolutionService.getInstance();
  }

  public static getInstance(): IncrementalSyncService {
    if (!IncrementalSyncService.instance) {
      IncrementalSyncService.instance = new IncrementalSyncService();
    }
    return IncrementalSyncService.instance;
  }

  /**
   * Perform incremental sync with server
   */
  public async performIncrementalSync(apiUrl: string, authToken: string): Promise<{
    success: boolean;
    itemsSynced: number;
    conflictsResolved: number;
    bytesTransferred: number;
    error?: string;
  }> {
    try {
      logger.info('Starting incremental sync');
      
      // Get last sync timestamp
      const lastSyncTime = await this.getLastSyncTimestamp();
      const deviceId = await this.storage.getDeviceId();
      
      // Get server deltas since last sync
      const serverDeltas = await this.fetchServerDeltas(apiUrl, authToken, lastSyncTime);
      
      // Get local deltas since last sync
      const localDeltas = await this.getLocalDeltas(lastSyncTime);
      
      // Apply server deltas locally
      const serverApplyResult = await this.applyServerDeltas(serverDeltas);
      
      // Send local deltas to server
      const localUploadResult = await this.uploadLocalDeltas(apiUrl, authToken, localDeltas, deviceId);
      
      // Update last sync timestamp
      await this.updateLastSyncTimestamp(serverDeltas.serverTimestamp);
      
      const result = {
        success: true,
        itemsSynced: serverApplyResult.itemsSynced + localUploadResult.itemsSynced,
        conflictsResolved: serverApplyResult.conflictsResolved,
        bytesTransferred: serverApplyResult.bytesTransferred + localUploadResult.bytesTransferred
      };
      
      logger.info('Incremental sync completed', result);
      return result;
      
    } catch (error: any) {
      logger.error('Incremental sync failed', { error });
      return {
        success: false,
        itemsSynced: 0,
        conflictsResolved: 0,
        bytesTransferred: 0,
        error: error.message
      };
    }
  }

  /**
   * Fetch deltas from server since last sync
   */
  private async fetchServerDeltas(apiUrl: string, authToken: string, since: string): Promise<DeltaSync> {
    const url = `${apiUrl}/sync/delta?since=${encodeURIComponent(since)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch server deltas: ${response.status}`);
    }

    const deltaSync: DeltaSync = await response.json();
    logger.debug('Fetched server deltas', {
      transactionsCreated: deltaSync.transactions.created.length,
      transactionsUpdated: deltaSync.transactions.updated.length,
      transactionsDeleted: deltaSync.transactions.deleted.length,
      categoriesCreated: deltaSync.categories.created.length,
      categoriesUpdated: deltaSync.categories.updated.length,
      categoriesDeleted: deltaSync.categories.deleted.length
    });

    return deltaSync;
  }

  /**
   * Get local deltas since last sync
   */
  private async getLocalDeltas(since: string): Promise<SyncDelta[]> {
    const deltas: SyncDelta[] = [];
    
    // Get local sync metadata
    const syncMetadata = await this.getLocalSyncMetadata(since);
    
    for (const metadata of syncMetadata) {
      const delta: SyncDelta = {
        entityType: metadata.entityType,
        action: metadata.action,
        entityId: metadata.entityId,
        timestamp: metadata.lastModified,
        checksum: metadata.checksum
      };
      
      // Add data for create/update actions
      if (metadata.action !== 'delete') {
        if (metadata.entityType === 'transaction') {
          delta.data = await this.getTransactionById(metadata.entityId);
        } else {
          delta.data = await this.getCategoryById(metadata.entityId);
        }
      }
      
      deltas.push(delta);
    }
    
    logger.debug('Generated local deltas', { count: deltas.length });
    return deltas;
  }

  /**
   * Apply server deltas to local database
   */
  private async applyServerDeltas(serverDeltas: DeltaSync): Promise<{
    itemsSynced: number;
    conflictsResolved: number;
    bytesTransferred: number;
  }> {
    let itemsSynced = 0;
    let conflictsResolved = 0;
    let bytesTransferred = 0;

    // Apply transaction deltas
    for (const transaction of serverDeltas.transactions.created) {
      await this.createLocalTransaction(transaction);
      itemsSynced++;
      bytesTransferred += this.estimateObjectSize(transaction);
    }

    for (const transaction of serverDeltas.transactions.updated) {
      const conflict = await this.updateLocalTransaction(transaction);
      if (conflict) conflictsResolved++;
      itemsSynced++;
      bytesTransferred += this.estimateObjectSize(transaction);
    }

    for (const transactionId of serverDeltas.transactions.deleted) {
      await this.deleteLocalTransaction(transactionId);
      itemsSynced++;
      bytesTransferred += 50; // Estimate for ID
    }

    // Apply category deltas
    for (const category of serverDeltas.categories.created) {
      await this.createLocalCategory(category);
      itemsSynced++;
      bytesTransferred += this.estimateObjectSize(category);
    }

    for (const category of serverDeltas.categories.updated) {
      const conflict = await this.updateLocalCategory(category);
      if (conflict) conflictsResolved++;
      itemsSynced++;
      bytesTransferred += this.estimateObjectSize(category);
    }

    for (const categoryId of serverDeltas.categories.deleted) {
      await this.deleteLocalCategory(categoryId);
      itemsSynced++;
      bytesTransferred += 50; // Estimate for ID
    }

    return { itemsSynced, conflictsResolved, bytesTransferred };
  }

  /**
   * Upload local deltas to server
   */
  private async uploadLocalDeltas(
    apiUrl: string, 
    authToken: string, 
    localDeltas: SyncDelta[], 
    deviceId: string
  ): Promise<{
    itemsSynced: number;
    bytesTransferred: number;
  }> {
    if (localDeltas.length === 0) {
      return { itemsSynced: 0, bytesTransferred: 0 };
    }

    const payload = {
      deltas: localDeltas,
      deviceId,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(`${apiUrl}/sync/delta`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to upload local deltas: ${response.status}`);
    }

    const bytesTransferred = this.estimateObjectSize(payload);
    
    logger.debug('Uploaded local deltas', {
      count: localDeltas.length,
      bytesTransferred
    });

    return {
      itemsSynced: localDeltas.length,
      bytesTransferred
    };
  }

  /**
   * Create local transaction
   */
  private async createLocalTransaction(transaction: Transaction): Promise<void> {
    // Implementation would depend on your local database service
    // For now, just log the action
    logger.debug('Creating local transaction', { id: transaction.id });
    
    // Create sync metadata
    await this.createSyncMetadata({
      entityType: 'transaction',
      entityId: transaction.id,
      lastModified: new Date().toISOString(),
      checksum: this.calculateChecksum(transaction),
      action: 'create',
      deviceId: await this.storage.getDeviceId()
    });
  }

  /**
   * Update local transaction with conflict resolution
   */
  private async updateLocalTransaction(remoteTransaction: Transaction): Promise<boolean> {
    // Get local version
    const localTransaction = await this.getTransactionById(remoteTransaction.id);
    
    if (!localTransaction) {
      // No local version, just create
      await this.createLocalTransaction(remoteTransaction);
      return false;
    }

    // Check for conflicts
    const localChecksum = this.calculateChecksum(localTransaction);
    const remoteChecksum = this.calculateChecksum(remoteTransaction);
    
    if (localChecksum === remoteChecksum) {
      // No conflict
      return false;
    }

    // Resolve conflict
    const resolution = this.conflictResolver.resolveTransactionConflict({
      local: localTransaction,
      remote: remoteTransaction
    });

    // Apply resolution
    logger.debug('Applying transaction conflict resolution', {
      transactionId: remoteTransaction.id,
      resolution: resolution.resolution,
      confidence: resolution.confidence
    });

    // Update local transaction with resolved data
    // Implementation would depend on your local database service
    
    // Update sync metadata
    await this.updateSyncMetadata({
      entityType: 'transaction',
      entityId: remoteTransaction.id,
      lastModified: new Date().toISOString(),
      checksum: this.calculateChecksum(resolution.data),
      action: 'update',
      deviceId: await this.storage.getDeviceId()
    });

    return true; // Conflict was resolved
  }

  /**
   * Delete local transaction
   */
  private async deleteLocalTransaction(transactionId: string): Promise<void> {
    logger.debug('Deleting local transaction', { id: transactionId });
    
    // Implementation would depend on your local database service
    
    // Update sync metadata
    await this.updateSyncMetadata({
      entityType: 'transaction',
      entityId: transactionId,
      lastModified: new Date().toISOString(),
      checksum: '',
      action: 'delete',
      deviceId: await this.storage.getDeviceId()
    });
  }

  /**
   * Create local category
   */
  private async createLocalCategory(category: Category): Promise<void> {
    logger.debug('Creating local category', { id: category.id });
    
    await this.createSyncMetadata({
      entityType: 'category',
      entityId: category.id,
      lastModified: new Date().toISOString(),
      checksum: this.calculateChecksum(category),
      action: 'create',
      deviceId: await this.storage.getDeviceId()
    });
  }

  /**
   * Update local category with conflict resolution
   */
  private async updateLocalCategory(remoteCategory: Category): Promise<boolean> {
    const localCategory = await this.getCategoryById(remoteCategory.id);
    
    if (!localCategory) {
      await this.createLocalCategory(remoteCategory);
      return false;
    }

    const localChecksum = this.calculateChecksum(localCategory);
    const remoteChecksum = this.calculateChecksum(remoteCategory);
    
    if (localChecksum === remoteChecksum) {
      return false;
    }

    // Resolve conflict
    const resolution = this.conflictResolver.resolveCategoryConflict({
      local: localCategory,
      remote: remoteCategory
    });

    logger.debug('Applying category conflict resolution', {
      categoryId: remoteCategory.id,
      resolution: resolution.resolution,
      confidence: resolution.confidence
    });

    await this.updateSyncMetadata({
      entityType: 'category',
      entityId: remoteCategory.id,
      lastModified: new Date().toISOString(),
      checksum: this.calculateChecksum(resolution.data),
      action: 'update',
      deviceId: await this.storage.getDeviceId()
    });

    return true;
  }

  /**
   * Delete local category
   */
  private async deleteLocalCategory(categoryId: string): Promise<void> {
    logger.debug('Deleting local category', { id: categoryId });
    
    await this.updateSyncMetadata({
      entityType: 'category',
      entityId: categoryId,
      lastModified: new Date().toISOString(),
      checksum: '',
      action: 'delete',
      deviceId: await this.storage.getDeviceId()
    });
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: any): string {
    // Simple checksum calculation (in production, use a proper hash function)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Estimate object size in bytes
   */
  private estimateObjectSize(obj: any): number {
    return JSON.stringify(obj).length * 2; // Rough estimate (UTF-16)
  }

  /**
   * Get last sync timestamp
   */
  private async getLastSyncTimestamp(): Promise<string> {
    const config = await this.storage.getSyncConfig();
    return config?.lastSyncTime || new Date(0).toISOString();
  }

  /**
   * Update last sync timestamp
   */
  private async updateLastSyncTimestamp(timestamp: string): Promise<void> {
    await this.storage.updateLastSyncTime(timestamp);
  }

  /**
   * Placeholder methods for database operations
   * These would be implemented with your actual database service
   */
  private async getTransactionById(id: string): Promise<Transaction | null> {
    // TODO: Implement with actual database service
    return null;
  }

  private async getCategoryById(id: string): Promise<Category | null> {
    // TODO: Implement with actual database service
    return null;
  }

  private async getLocalSyncMetadata(since: string): Promise<SyncMetadata[]> {
    // TODO: Implement with actual sync metadata storage
    return [];
  }

  private async createSyncMetadata(metadata: SyncMetadata): Promise<void> {
    // TODO: Implement with actual sync metadata storage
    logger.debug('Creating sync metadata', metadata);
  }

  private async updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
    // TODO: Implement with actual sync metadata storage
    logger.debug('Updating sync metadata', metadata);
  }

  /**
   * Clear all sync metadata (for reset)
   */
  public async clearSyncMetadata(): Promise<void> {
    // TODO: Implement with actual sync metadata storage
    logger.info('Clearing all sync metadata');
  }

  /**
   * Get sync statistics
   */
  public async getSyncStats(): Promise<{
    totalEntities: number;
    pendingSync: number;
    lastSyncTime: string;
    conflictsResolved: number;
  }> {
    // TODO: Implement with actual sync metadata storage
    const lastSyncTime = await this.getLastSyncTimestamp();
    
    return {
      totalEntities: 0,
      pendingSync: 0,
      lastSyncTime,
      conflictsResolved: 0
    };
  }
}