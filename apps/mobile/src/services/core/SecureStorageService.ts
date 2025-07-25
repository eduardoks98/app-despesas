/**
 * Secure Storage Service
 * 
 * Handles secure storage of authentication tokens and sensitive data
 * Uses Expo SecureStore for encryption
 */

import * as SecureStore from 'expo-secure-store';
import { logger } from '../../../packages/shared/src/utils/logger';

export type StorageKey = 
  | 'auth_token' 
  | 'refresh_token' 
  | 'user_data'
  | 'sync_config'
  | 'device_id';

export interface UserData {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  subscriptionStatus?: string;
}

export interface SyncConfig {
  lastSyncTime?: string;
  deviceId: string;
  autoSync: boolean;
  syncInterval: number;
}

export class SecureStorageService {
  private static instance: SecureStorageService;

  private constructor() {}

  public static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  /**
   * Store a value securely
   */
  public async setItem(key: StorageKey, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
      logger.debug('SecureStorage: Item stored', { key });
    } catch (error) {
      logger.error('SecureStorage: Failed to store item', { key, error });
      throw new Error(`Failed to store ${key}`);
    }
  }

  /**
   * Get a stored value
   */
  public async getItem(key: StorageKey): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        logger.debug('SecureStorage: Item retrieved', { key });
      }
      return value;
    } catch (error) {
      logger.error('SecureStorage: Failed to retrieve item', { key, error });
      return null;
    }
  }

  /**
   * Remove a stored value
   */
  public async removeItem(key: StorageKey): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      logger.debug('SecureStorage: Item removed', { key });
    } catch (error) {
      logger.error('SecureStorage: Failed to remove item', { key, error });
    }
  }

  /**
   * Check if a key exists
   */
  public async hasItem(key: StorageKey): Promise<boolean> {
    try {
      const value = await this.getItem(key);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store JSON object
   */
  public async setObject<T>(key: StorageKey, value: T): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.setItem(key, jsonString);
    } catch (error) {
      logger.error('SecureStorage: Failed to store object', { key, error });
      throw new Error(`Failed to store ${key} object`);
    }
  }

  /**
   * Get JSON object
   */
  public async getObject<T>(key: StorageKey): Promise<T | null> {
    try {
      const jsonString = await this.getItem(key);
      if (!jsonString) return null;
      
      return JSON.parse(jsonString) as T;
    } catch (error) {
      logger.error('SecureStorage: Failed to parse object', { key, error });
      return null;
    }
  }

  /**
   * Clear all stored data (for logout)
   */
  public async clearAll(): Promise<void> {
    try {
      const keys: StorageKey[] = [
        'auth_token',
        'refresh_token',
        'user_data',
        'sync_config'
      ];

      await Promise.all(keys.map(key => this.removeItem(key)));
      logger.info('SecureStorage: All data cleared');
    } catch (error) {
      logger.error('SecureStorage: Failed to clear all data', { error });
    }
  }

  // ==================== AUTH TOKEN METHODS ====================

  /**
   * Store authentication tokens
   */
  public async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setItem('auth_token', accessToken),
      this.setItem('refresh_token', refreshToken)
    ]);
    logger.info('SecureStorage: Auth tokens stored');
  }

  /**
   * Get access token
   */
  public async getAccessToken(): Promise<string | null> {
    return this.getItem('auth_token');
  }

  /**
   * Get refresh token
   */
  public async getRefreshToken(): Promise<string | null> {
    return this.getItem('refresh_token');
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return accessToken !== null;
  }

  /**
   * Clear authentication data
   */
  public async clearAuth(): Promise<void> {
    await Promise.all([
      this.removeItem('auth_token'),
      this.removeItem('refresh_token'),
      this.removeItem('user_data')
    ]);
    logger.info('SecureStorage: Auth data cleared');
  }

  // ==================== USER DATA METHODS ====================

  /**
   * Store user data
   */
  public async storeUserData(userData: UserData): Promise<void> {
    await this.setObject('user_data', userData);
    logger.info('SecureStorage: User data stored', { userId: userData.id });
  }

  /**
   * Get user data
   */
  public async getUserData(): Promise<UserData | null> {
    return this.getObject<UserData>('user_data');
  }

  // ==================== SYNC CONFIG METHODS ====================

  /**
   * Store sync configuration
   */
  public async storeSyncConfig(config: SyncConfig): Promise<void> {
    await this.setObject('sync_config', config);
    logger.debug('SecureStorage: Sync config stored');
  }

  /**
   * Get sync configuration
   */
  public async getSyncConfig(): Promise<SyncConfig | null> {
    return this.getObject<SyncConfig>('sync_config');
  }

  /**
   * Update last sync time
   */
  public async updateLastSyncTime(timestamp: string): Promise<void> {
    const config = await this.getSyncConfig();
    if (config) {
      config.lastSyncTime = timestamp;
      await this.storeSyncConfig(config);
    }
  }

  // ==================== DEVICE ID METHODS ====================

  /**
   * Get or generate device ID
   */
  public async getDeviceId(): Promise<string> {
    let deviceId = await this.getItem('device_id');
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = this.generateDeviceId();
      await this.setItem('device_id', deviceId);
      logger.info('SecureStorage: New device ID generated');
    }
    
    return deviceId;
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `mobile_${timestamp}_${random}`;
  }

  // ==================== MIGRATION METHODS ====================

  /**
   * Migrate data from old storage format (if needed)
   */
  public async migrateIfNeeded(): Promise<void> {
    try {
      // Check if migration is needed
      const migrated = await this.getItem('migrated_v1' as StorageKey);
      if (migrated) return;

      logger.info('SecureStorage: Starting migration...');

      // Add migration logic here if needed
      // For now, just mark as migrated
      await this.setItem('migrated_v1' as StorageKey, 'true');
      
      logger.info('SecureStorage: Migration completed');
    } catch (error) {
      logger.error('SecureStorage: Migration failed', { error });
    }
  }

  // ==================== DEBUG METHODS ====================

  /**
   * Get storage info for debugging
   */
  public async getStorageInfo(): Promise<Record<string, boolean>> {
    const keys: StorageKey[] = [
      'auth_token',
      'refresh_token', 
      'user_data',
      'sync_config',
      'device_id'
    ];

    const info: Record<string, boolean> = {};
    
    for (const key of keys) {
      info[key] = await this.hasItem(key);
    }
    
    return info;
  }
}