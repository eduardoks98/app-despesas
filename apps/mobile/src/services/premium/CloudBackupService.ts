/**
 * Cloud Backup Service - Premium feature for automatic cloud backups
 */

import { DatabaseService } from '../core/DatabaseService';
import { AuthenticationService } from '../core/AuthenticationService';
import { AnalyticsService } from '../core/AnalyticsService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface BackupMetadata {
  id: string;
  userId: string;
  timestamp: string;
  version: string;
  size: number;
  checksum: string;
  deviceId: string;
  platform: string;
  transactionCount: number;
  categoryCount: number;
  isAutoBackup: boolean;
}

export interface BackupData {
  metadata: BackupMetadata;
  transactions: any[];
  categories: any[];
  userPreferences: any;
  version: string;
}

export interface CloudBackupConfig {
  autoBackupEnabled: boolean;
  backupInterval: number; // hours
  maxBackupsToKeep: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

export class CloudBackupService {
  private static instance: CloudBackupService;
  private dbService: DatabaseService;
  private authService: AuthenticationService;
  private analyticsService: AnalyticsService;
  private isBackupInProgress = false;
  private backupInterval: NodeJS.Timer | null = null;

  private config: CloudBackupConfig = {
    autoBackupEnabled: true,
    backupInterval: 24, // 24 hours
    maxBackupsToKeep: 30,
    compressionEnabled: true,
    encryptionEnabled: true,
  };

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.authService = AuthenticationService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): CloudBackupService {
    if (!CloudBackupService.instance) {
      CloudBackupService.instance = new CloudBackupService();
    }
    return CloudBackupService.instance;
  }

  /**
   * Initialize backup service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      
      if (this.config.autoBackupEnabled) {
        this.startAutoBackup();
      }

      // Check if restore is needed on first launch
      await this.checkForRestoreOnStartup();

      logger.info('Cloud backup service initialized', this.config);
    } catch (error) {
      logger.error('Failed to initialize cloud backup service', { error });
    }
  }

  /**
   * Create manual backup
   */
  async createBackup(isAutoBackup = false): Promise<{ success: boolean; backupId?: string; error?: string }> {
    if (this.isBackupInProgress) {
      return { success: false, error: 'Backup already in progress' };
    }

    try {
      this.isBackupInProgress = true;
      
      // Check if user is premium
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Cloud backup is a premium feature' };
      }

      // Create backup data
      const backupData = await this.createBackupData(isAutoBackup);
      
      // Upload to cloud
      const uploadResult = await this.uploadBackup(backupData);
      
      if (uploadResult.success) {
        // Update local backup history
        await this.updateBackupHistory(backupData.metadata);
        
        // Cleanup old backups
        await this.cleanupOldBackups();
        
        // Track analytics
        await this.analyticsService.track('backup_created', {
          backupId: backupData.metadata.id,
          isAutoBackup,
          size: backupData.metadata.size,
          transactionCount: backupData.metadata.transactionCount,
        });

        logger.info('Backup created successfully', { 
          backupId: backupData.metadata.id,
          isAutoBackup 
        });

        return { success: true, backupId: backupData.metadata.id };
      } else {
        return { success: false, error: uploadResult.error };
      }
    } catch (error) {
      logger.error('Backup creation failed', { error });
      return { success: false, error: 'Backup creation failed' };
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user is premium
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Cloud restore is a premium feature' };
      }

      // Download backup
      const backupData = await this.downloadBackup(backupId);
      if (!backupData) {
        return { success: false, error: 'Backup not found or corrupted' };
      }

      // Verify backup integrity
      const isValid = await this.verifyBackupIntegrity(backupData);
      if (!isValid) {
        return { success: false, error: 'Backup integrity check failed' };
      }

      // Create local backup before restore
      await this.createLocalBackupBeforeRestore();

      // Restore data
      await this.restoreData(backupData);

      // Track analytics
      await this.analyticsService.track('backup_restored', {
        backupId,
        transactionCount: backupData.metadata.transactionCount,
        categoryCount: backupData.metadata.categoryCount,
      });

      logger.info('Backup restored successfully', { backupId });
      return { success: true };
    } catch (error) {
      logger.error('Backup restoration failed', { backupId, error });
      return { success: false, error: 'Backup restoration failed' };
    }
  }

  /**
   * Get available backups
   */
  async getBackupHistory(): Promise<BackupMetadata[]> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return [];
      }

      return await this.fetchBackupHistory();
    } catch (error) {
      logger.error('Failed to fetch backup history', { error });
      return [];
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Unauthorized' };
      }

      const result = await this.deleteCloudBackup(backupId);
      
      if (result.success) {
        await this.removeFromBackupHistory(backupId);
        
        await this.analyticsService.track('backup_deleted', { backupId });
        
        logger.info('Backup deleted successfully', { backupId });
      }

      return result;
    } catch (error) {
      logger.error('Failed to delete backup', { backupId, error });
      return { success: false, error: 'Failed to delete backup' };
    }
  }

  /**
   * Configure backup settings
   */
  async updateConfig(newConfig: Partial<CloudBackupConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();

    if (this.config.autoBackupEnabled) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
    }

    logger.info('Backup config updated', this.config);
  }

  /**
   * Get backup status
   */
  getBackupStatus(): {
    isInProgress: boolean;
    lastBackup: Date | null;
    nextScheduledBackup: Date | null;
    autoBackupEnabled: boolean;
  } {
    return {
      isInProgress: this.isBackupInProgress,
      lastBackup: this.getLastBackupDate(),
      nextScheduledBackup: this.getNextScheduledBackup(),
      autoBackupEnabled: this.config.autoBackupEnabled,
    };
  }

  /**
   * Private methods
   */
  private async createBackupData(isAutoBackup: boolean): Promise<BackupData> {
    const transactions = await this.dbService.query('SELECT * FROM transactions ORDER BY date DESC');
    const categories = await this.dbService.query('SELECT * FROM categories');
    const userPreferences = await this.dbService.query('SELECT * FROM user_preferences LIMIT 1');

    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    const user = await this.authService.getCurrentUser();

    const data = {
      transactions,
      categories,
      userPreferences: userPreferences[0] || {},
      version: '1.0.0',
    };

    const serializedData = JSON.stringify(data);
    const size = new Blob([serializedData]).size;
    const checksum = await this.calculateChecksum(serializedData);

    const metadata: BackupMetadata = {
      id: backupId,
      userId: user!.id,
      timestamp,
      version: '1.0.0',
      size,
      checksum,
      deviceId: await this.getDeviceId(),
      platform: 'mobile',
      transactionCount: transactions.length,
      categoryCount: categories.length,
      isAutoBackup,
    };

    return {
      metadata,
      transactions,
      categories,
      userPreferences: userPreferences[0] || {},
      version: '1.0.0',
    };
  }

  private async uploadBackup(backupData: BackupData): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.authService.getAccessToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      // Compress if enabled
      let dataToUpload = JSON.stringify(backupData);
      if (this.config.compressionEnabled) {
        dataToUpload = await this.compressData(dataToUpload);
      }

      // Encrypt if enabled
      if (this.config.encryptionEnabled) {
        dataToUpload = await this.encryptData(dataToUpload);
      }

      const response = await fetch(`${process.env.API_URL}/api/backups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: backupData.metadata,
          data: dataToUpload,
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  private async downloadBackup(backupId: string): Promise<BackupData | null> {
    try {
      const token = await this.authService.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${process.env.API_URL}/api/backups/${backupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        let data = result.data;

        // Decrypt if needed
        if (this.config.encryptionEnabled) {
          data = await this.decryptData(data);
        }

        // Decompress if needed
        if (this.config.compressionEnabled) {
          data = await this.decompressData(data);
        }

        return JSON.parse(data);
      }

      return null;
    } catch (error) {
      logger.error('Failed to download backup', { backupId, error });
      return null;
    }
  }

  private async restoreData(backupData: BackupData): Promise<void> {
    // Start transaction
    await this.dbService.beginTransaction();

    try {
      // Clear existing data
      await this.dbService.query('DELETE FROM transactions');
      await this.dbService.query('DELETE FROM categories WHERE isSystem = 0');
      await this.dbService.query('DELETE FROM user_preferences');

      // Restore categories
      for (const category of backupData.categories) {
        await this.dbService.query(
          `INSERT INTO categories (id, name, icon, color, isSystem, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            category.id,
            category.name,
            category.icon,
            category.color,
            category.isSystem,
            category.createdAt,
            category.updatedAt,
          ]
        );
      }

      // Restore transactions
      for (const transaction of backupData.transactions) {
        await this.dbService.query(
          `INSERT INTO transactions (id, amount, description, date, categoryId, type, tags, notes, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction.id,
            transaction.amount,
            transaction.description,
            transaction.date,
            transaction.categoryId,
            transaction.type,
            transaction.tags,
            transaction.notes,
            transaction.createdAt,
            transaction.updatedAt,
          ]
        );
      }

      // Restore user preferences
      if (backupData.userPreferences && Object.keys(backupData.userPreferences).length > 0) {
        const prefs = backupData.userPreferences;
        await this.dbService.query(
          `INSERT INTO user_preferences (currency, theme, language, notifications, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            prefs.currency,
            prefs.theme,
            prefs.language,
            prefs.notifications,
            prefs.createdAt,
            prefs.updatedAt,
          ]
        );
      }

      // Commit transaction
      await this.dbService.commitTransaction();
    } catch (error) {
      // Rollback on error
      await this.dbService.rollbackTransaction();
      throw error;
    }
  }

  private async verifyBackupIntegrity(backupData: BackupData): Promise<boolean> {
    try {
      const serializedData = JSON.stringify({
        transactions: backupData.transactions,
        categories: backupData.categories,
        userPreferences: backupData.userPreferences,
        version: backupData.version,
      });

      const currentChecksum = await this.calculateChecksum(serializedData);
      return currentChecksum === backupData.metadata.checksum;
    } catch (error) {
      return false;
    }
  }

  private async startAutoBackup(): Promise<void> {
    this.stopAutoBackup();
    
    const intervalMs = this.config.backupInterval * 60 * 60 * 1000; // Convert hours to ms
    
    this.backupInterval = setInterval(async () => {
      const user = await this.authService.getCurrentUser();
      if (user?.isPremium) {
        await this.createBackup(true);
      }
    }, intervalMs);

    logger.info('Auto backup started', { 
      intervalHours: this.config.backupInterval 
    });
  }

  private stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      logger.info('Auto backup stopped');
    }
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateChecksum(data: string): Promise<string> {
    // Simple checksum implementation - in production, use crypto libraries
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
      checksum += data.charCodeAt(i);
    }
    return checksum.toString(16);
  }

  private async getDeviceId(): Promise<string> {
    // Implementation depends on platform
    return 'device_' + Math.random().toString(36).substr(2, 9);
  }

  // Placeholder methods for compression/encryption
  private async compressData(data: string): Promise<string> {
    // Implement compression logic
    return data;
  }

  private async decompressData(data: string): Promise<string> {
    // Implement decompression logic
    return data;
  }

  private async encryptData(data: string): Promise<string> {
    // Implement encryption logic
    return data;
  }

  private async decryptData(data: string): Promise<string> {
    // Implement decryption logic
    return data;
  }

  // Placeholder methods for additional functionality
  private async loadConfig(): Promise<void> {
    // Load config from storage
  }

  private async saveConfig(): Promise<void> {
    // Save config to storage
  }

  private async updateBackupHistory(metadata: BackupMetadata): Promise<void> {
    // Update local backup history
  }

  private async fetchBackupHistory(): Promise<BackupMetadata[]> {
    // Fetch backup history from API
    return [];
  }

  private async removeFromBackupHistory(backupId: string): Promise<void> {
    // Remove from local backup history
  }

  private async deleteCloudBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
    // Delete from cloud storage
    return { success: true };
  }

  private async cleanupOldBackups(): Promise<void> {
    // Cleanup old backups based on config
  }

  private async checkForRestoreOnStartup(): Promise<void> {
    // Check if restore is needed on app startup
  }

  private async createLocalBackupBeforeRestore(): Promise<void> {
    // Create local backup before restore
  }

  private getLastBackupDate(): Date | null {
    // Get last backup date from storage
    return null;
  }

  private getNextScheduledBackup(): Date | null {
    if (!this.config.autoBackupEnabled) return null;
    
    const lastBackup = this.getLastBackupDate();
    if (!lastBackup) return new Date();
    
    const nextBackup = new Date(lastBackup);
    nextBackup.setHours(nextBackup.getHours() + this.config.backupInterval);
    
    return nextBackup;
  }
}