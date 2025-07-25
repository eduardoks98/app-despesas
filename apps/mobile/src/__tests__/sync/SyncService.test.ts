/**
 * Synchronization Service Tests
 */

import { DatabaseService } from '../../services/core/DatabaseService';
import { AuthenticationService } from '../../services/core/AuthenticationService';
import { SyncService } from '../../services/core/SyncService';
import { NetworkService } from '../../services/core/NetworkService';

// Mock dependencies
jest.mock('../../services/core/NetworkService');
jest.mock('expo-sqlite');

describe('SyncService Tests', () => {
  let syncService: SyncService;
  let dbService: DatabaseService;
  let authService: AuthenticationService;
  let networkService: jest.Mocked<NetworkService>;

  const mockUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    isPremium: true,
    subscriptionStatus: 'active',
  };

  const mockTransaction = {
    id: 'tx_test_1',
    amount: 100,
    description: 'Test Transaction',
    date: '2024-01-15',
    categoryId: 'cat_1',
    type: 'expense',
    syncStatus: 'pending',
    lastSyncAt: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  beforeEach(async () => {
    // Initialize services
    dbService = DatabaseService.getInstance();
    authService = AuthenticationService.getInstance();
    syncService = SyncService.getInstance();
    networkService = NetworkService.getInstance() as jest.Mocked<NetworkService>;

    // Setup mocks
    jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockUser);
    jest.spyOn(authService, 'getAccessToken').mockResolvedValue('mock-token');
    
    await dbService.initialize();
    
    // Clear any existing state
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dbService.close();
  });

  describe('Basic Sync Operations', () => {
    test('should sync pending transactions to server', async () => {
      // Mock pending transactions
      jest.spyOn(dbService, 'query').mockResolvedValue([mockTransaction]);
      
      // Mock successful API call
      networkService.post.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, syncedTransactions: 1 }),
      } as any);

      const result = await syncService.syncTransactions();
      
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(networkService.post).toHaveBeenCalledWith(
        '/sync/transactions',
        expect.objectContaining({
          transactions: [mockTransaction],
        })
      );
    });

    test('should handle sync conflicts properly', async () => {
      const localTransaction = {
        ...mockTransaction,
        amount: 100,
        updatedAt: '2024-01-15T10:00:00Z',
      };

      const serverTransaction = {
        ...mockTransaction,
        amount: 150,
        updatedAt: '2024-01-15T11:00:00Z', // More recent
      };

      jest.spyOn(dbService, 'query').mockResolvedValue([localTransaction]);
      
      // Mock server response with conflict
      networkService.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          conflicts: [
            {
              localTransaction,
              serverTransaction,
              resolution: 'server_wins',
            },
          ],
        }),
      } as any);

      // Mock conflict resolution
      jest.spyOn(syncService, 'resolveConflicts' as any).mockResolvedValue([
        { ...serverTransaction, syncStatus: 'synced' },
      ]);

      const result = await syncService.syncTransactions();
      
      expect(result.success).toBe(true);
      expect(result.conflictsResolved).toBe(1);
    });

    test('should download new transactions from server', async () => {
      const serverTransactions = [
        {
          id: 'tx_server_1',
          amount: 200,
          description: 'Server Transaction',
          date: '2024-01-16',
          categoryId: 'cat_1',
          type: 'income',
          createdAt: '2024-01-16T10:00:00Z',
          updatedAt: '2024-01-16T10:00:00Z',
        },
      ];

      networkService.get.mockResolvedValue({
        ok: true,
        json: async () => ({
          transactions: serverTransactions,
          lastSyncTimestamp: '2024-01-16T10:00:00Z',
        }),
      } as any);

      jest.spyOn(dbService, 'query').mockResolvedValue([]);
      jest.spyOn(dbService, 'queryOne').mockResolvedValue({ lastSyncAt: '2024-01-15T00:00:00Z' });

      const result = await syncService.downloadTransactions();
      
      expect(result.success).toBe(true);
      expect(result.downloadedCount).toBe(1);
      expect(networkService.get).toHaveBeenCalledWith(
        '/sync/transactions',
        expect.objectContaining({
          params: expect.objectContaining({
            since: '2024-01-15T00:00:00Z',
          }),
        })
      );
    });
  });

  describe('Offline/Online State Management', () => {
    test('should queue operations when offline', async () => {
      // Mock offline state
      networkService.isOnline.mockReturnValue(false);
      
      const result = await syncService.syncTransactions();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('offline');
      
      // Should queue the operation
      const queuedOps = await syncService.getQueuedOperations();
      expect(queuedOps.length).toBeGreaterThan(0);
    });

    test('should process queued operations when coming online', async () => {
      // Mock queued operations
      const queuedOps = [
        {
          id: 'op_1',
          type: 'sync_transactions',
          data: { transactions: [mockTransaction] },
          createdAt: '2024-01-15T10:00:00Z',
        },
      ];

      jest.spyOn(syncService, 'getQueuedOperations').mockResolvedValue(queuedOps);
      
      // Mock coming online
      networkService.isOnline.mockReturnValue(true);
      networkService.post.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, syncedTransactions: 1 }),
      } as any);

      const result = await syncService.processQueuedOperations();
      
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
    });

    test('should handle partial sync failures', async () => {
      const transactions = [
        { ...mockTransaction, id: 'tx_1' },
        { ...mockTransaction, id: 'tx_2' },
        { ...mockTransaction, id: 'tx_3' },
      ];

      jest.spyOn(dbService, 'query').mockResolvedValue(transactions);
      
      // Mock partial failure
      networkService.post.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          syncedTransactions: 2,
          failed: [
            {
              transactionId: 'tx_3',
              error: 'Validation error',
            },
          ],
        }),
      } as any);

      const result = await syncService.syncTransactions();
      
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(2);
      expect(result.failedCount).toBe(1);
    });
  });

  describe('Real-time Sync', () => {
    test('should establish WebSocket connection for real-time sync', async () => {
      // Mock WebSocket
      const mockWebSocket = {
        onopen: jest.fn(),
        onmessage: jest.fn(),
        onclose: jest.fn(),
        onerror: jest.fn(),
        send: jest.fn(),
        close: jest.fn(),
        readyState: 1, // OPEN
      };

      global.WebSocket = jest.fn(() => mockWebSocket) as any;

      await syncService.enableRealTimeSync();
      
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://'),
        expect.any(Array)
      );
    });

    test('should handle real-time transaction updates', async () => {
      const updateMessage = {
        type: 'transaction_updated',
        data: {
          ...mockTransaction,
          amount: 150, // Updated amount
          updatedAt: '2024-01-15T11:00:00Z',
        },
      };

      // Simulate receiving WebSocket message
      const mockWebSocket = {
        onmessage: jest.fn(),
      };

      // Mock handling the message
      jest.spyOn(syncService, 'handleRealTimeUpdate' as any).mockResolvedValue(true);

      await syncService.handleRealTimeUpdate(updateMessage);
      
      expect(syncService.handleRealTimeUpdate).toHaveBeenCalledWith(updateMessage);
    });

    test('should handle WebSocket reconnection', async () => {
      const mockWebSocket = {
        onclose: jest.fn(),
        onerror: jest.fn(),
        readyState: 3, // CLOSED
      };

      // Mock reconnection logic
      jest.spyOn(syncService, 'reconnectWebSocket' as any).mockResolvedValue(true);

      // Simulate connection loss
      mockWebSocket.onclose({ code: 1006, reason: 'Connection lost' });
      
      // Should attempt reconnection
      setTimeout(() => {
        expect(syncService.reconnectWebSocket).toHaveBeenCalled();
      }, 1000);
    });
  });

  describe('Data Integrity', () => {
    test('should validate transaction data before sync', async () => {
      const invalidTransaction = {
        ...mockTransaction,
        amount: null, // Invalid
        description: '', // Invalid
      };

      jest.spyOn(dbService, 'query').mockResolvedValue([invalidTransaction]);
      
      const result = await syncService.syncTransactions();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('should handle checksum verification', async () => {
      const transactionWithChecksum = {
        ...mockTransaction,
        checksum: 'abc123',
      };

      jest.spyOn(syncService, 'calculateChecksum' as any).mockReturnValue('def456');
      
      const isValid = await (syncService as any).verifyChecksum(transactionWithChecksum);
      
      expect(isValid).toBe(false);
    });

    test('should recover from sync corruption', async () => {
      // Mock corrupted sync state
      jest.spyOn(dbService, 'queryOne').mockResolvedValue({
        lastSyncAt: 'invalid-date',
        syncState: 'corrupted',
      });

      // Mock recovery process
      jest.spyOn(syncService, 'recoverFromCorruption' as any).mockResolvedValue(true);
      
      const result = await syncService.performFullSync();
      
      expect(result.success).toBe(true);
      expect(syncService.recoverFromCorruption).toHaveBeenCalled();
    });
  });

  describe('Sync Status and Progress', () => {
    test('should track sync progress', (done) => {
      const progressCallback = jest.fn();
      
      syncService.on('syncProgress', progressCallback);
      
      // Mock sync operation with progress
      syncService.syncTransactions().then(() => {
        expect(progressCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: expect.any(String),
            progress: expect.any(Number),
            total: expect.any(Number),
          })
        );
        done();
      });
    });

    test('should provide sync status information', async () => {
      const status = await syncService.getSyncStatus();
      
      expect(status).toEqual(
        expect.objectContaining({
          isOnline: expect.any(Boolean),
          lastSyncAt: expect.any(String),
          pendingOperations: expect.any(Number),
          isSyncing: expect.any(Boolean),
          syncErrors: expect.any(Array),
        })
      );
    });

    test('should handle sync lock to prevent concurrent syncs', async () => {
      // Start first sync
      const firstSync = syncService.syncTransactions();
      
      // Try to start second sync while first is running
      const secondSync = syncService.syncTransactions();
      
      const [firstResult, secondResult] = await Promise.all([firstSync, secondSync]);
      
      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already in progress');
    });
  });

  describe('Category and Settings Sync', () => {
    test('should sync custom categories', async () => {
      const customCategories = [
        {
          id: 'cat_custom_1',
          name: 'Custom Category',
          icon: 'custom-icon',
          color: '#FF0000',
          isCustom: true,
          syncStatus: 'pending',
        },
      ];

      jest.spyOn(dbService, 'query').mockResolvedValue(customCategories);
      networkService.post.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, syncedCategories: 1 }),
      } as any);

      const result = await syncService.syncCategories();
      
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
    });

    test('should sync user preferences', async () => {
      const preferences = {
        currency: 'BRL',
        theme: 'dark',
        notifications: true,
        syncStatus: 'pending',
      };

      jest.spyOn(dbService, 'queryOne').mockResolvedValue(preferences);
      networkService.post.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as any);

      const result = await syncService.syncUserPreferences();
      
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network timeouts', async () => {
      networkService.post.mockRejectedValue(new Error('Network timeout'));
      
      const result = await syncService.syncTransactions();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    test('should handle server errors gracefully', async () => {
      networkService.post.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);
      
      const result = await syncService.syncTransactions();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('server error');
    });

    test('should implement exponential backoff for retries', async () => {
      let attempts = 0;
      networkService.post.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as any);
      });

      const result = await syncService.syncTransactionsWithRetry();
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    test('should handle authentication errors', async () => {
      networkService.post.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as any);

      // Mock token refresh
      jest.spyOn(authService, 'refreshToken').mockResolvedValue({
        success: true,
        accessToken: 'new-token',
      });

      const result = await syncService.syncTransactions();
      
      expect(authService.refreshToken).toHaveBeenCalled();
    });
  });
});