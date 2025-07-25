import { Transaction, TransactionType } from '../../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilter } from '../../../domain/repositories/ITransactionRepository';
import { DateRange } from '../../../domain/value-objects/DateRange';
import { ApiTransactionRepository } from '../api/ApiTransactionRepository';
import { SQLiteTransactionRepository } from '../sqlite/SQLiteTransactionRepository';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
}

/**
 * Hybrid repository that works online/offline
 * - When online: uses API and syncs to local cache
 * - When offline: uses local SQLite and queues changes
 * - Automatically syncs when connection is restored
 */
export class HybridTransactionRepository implements ITransactionRepository {
  private isOnline = true;
  private syncQueue: Array<{ action: string; data: any; timestamp: Date }> = [];

  constructor(
    private apiRepository: ApiTransactionRepository,
    private localRepository: SQLiteTransactionRepository
  ) {
    this.setupConnectivityListener();
  }

  async save(transaction: Transaction): Promise<void> {
    // Always save locally first (for immediate UI feedback)
    await this.localRepository.save(transaction);

    if (this.isOnline) {
      try {
        await this.apiRepository.save(transaction);
      } catch (error) {
        // If API fails, queue for later sync
        this.queueChange('save', transaction.toJSON());
        throw error;
      }
    } else {
      // Queue for sync when online
      this.queueChange('save', transaction.toJSON());
    }
  }

  async update(transaction: Transaction): Promise<void> {
    await this.localRepository.update(transaction);

    if (this.isOnline) {
      try {
        await this.apiRepository.update(transaction);
      } catch (error) {
        this.queueChange('update', transaction.toJSON());
        throw error;
      }
    } else {
      this.queueChange('update', transaction.toJSON());
    }
  }

  async delete(id: string): Promise<void> {
    await this.localRepository.delete(id);

    if (this.isOnline) {
      try {
        await this.apiRepository.delete(id);
      } catch (error) {
        this.queueChange('delete', { id });
        throw error;
      }
    } else {
      this.queueChange('delete', { id });
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    // Always try local first (faster)
    const localTransaction = await this.localRepository.findById(id);
    
    if (this.isOnline) {
      try {
        const apiTransaction = await this.apiRepository.findById(id);
        
        // If API has newer version, update local and return API version
        if (apiTransaction && (!localTransaction || 
            apiTransaction.updatedAt > localTransaction.updatedAt)) {
          await this.localRepository.save(apiTransaction);
          return apiTransaction;
        }
      } catch (error) {
        console.warn('Failed to fetch from API, using local version:', error);
      }
    }

    return localTransaction;
  }

  async findAll(filter?: TransactionFilter): Promise<Transaction[]> {
    if (this.isOnline) {
      try {
        // Get from API and update local cache
        const apiTransactions = await this.apiRepository.findAll(filter);
        
        // Update local cache in background
        this.updateLocalCache(apiTransactions);
        
        return apiTransactions;
      } catch (error) {
        console.warn('Failed to fetch from API, using local version:', error);
      }
    }

    // Fallback to local data
    return this.localRepository.findAll(filter);
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    return this.findAll({ categoryId });
  }

  async findByInstallment(installmentId: string): Promise<Transaction[]> {
    return this.findAll({ installmentId });
  }

  async findBySubscription(subscriptionId: string): Promise<Transaction[]> {
    return this.findAll({ subscriptionId });
  }

  async getTotalByType(type: TransactionType, dateRange?: DateRange): Promise<number> {
    if (this.isOnline) {
      try {
        return await this.apiRepository.getTotalByType(type, dateRange);
      } catch (error) {
        console.warn('Failed to get total from API, using local version:', error);
      }
    }

    return this.localRepository.getTotalByType(type, dateRange);
  }

  async getMonthlyBalance(year: number, month: number): Promise<{
    income: number;
    expense: number;
    balance: number;
  }> {
    if (this.isOnline) {
      try {
        return await this.apiRepository.getMonthlyBalance(year, month);
      } catch (error) {
        console.warn('Failed to get balance from API, using local version:', error);
      }
    }

    return this.localRepository.getMonthlyBalance(year, month);
  }

  // Sync management methods
  async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const changes = [...this.syncQueue];
    this.syncQueue = [];

    for (const change of changes) {
      try {
        switch (change.action) {
          case 'save':
            const saveTransaction = new Transaction(change.data);
            await this.apiRepository.save(saveTransaction);
            break;
          case 'update':
            const updateTransaction = new Transaction(change.data);
            await this.apiRepository.update(updateTransaction);
            break;
          case 'delete':
            await this.apiRepository.delete(change.data.id);
            break;
        }
      } catch (error) {
        // Re-queue failed changes
        this.syncQueue.push(change);
        console.error('Failed to sync change:', error);
      }
    }
  }

  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: null, // TODO: implement last sync tracking
      pendingChanges: this.syncQueue.length,
    };
  }

  // Force sync from server (pull latest data)
  async pullFromServer(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    try {
      const serverTransactions = await this.apiRepository.findAll();
      
      // Clear local cache and replace with server data
      // TODO: implement more sophisticated merge strategy
      await this.updateLocalCache(serverTransactions);
    } catch (error) {
      console.error('Failed to pull from server:', error);
      throw error;
    }
  }

  private queueChange(action: string, data: any): void {
    this.syncQueue.push({
      action,
      data,
      timestamp: new Date(),
    });
  }

  private async updateLocalCache(transactions: Transaction[]): Promise<void> {
    // Update local cache in background
    setTimeout(async () => {
      try {
        for (const transaction of transactions) {
          const existing = await this.localRepository.findById(transaction.id);
          if (!existing || transaction.updatedAt > existing.updatedAt) {
            await this.localRepository.save(transaction);
          }
        }
      } catch (error) {
        console.error('Failed to update local cache:', error);
      }
    }, 0);
  }

  private setupConnectivityListener(): void {
    // Listen for network changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncPendingChanges();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      this.isOnline = navigator.onLine;
    }
  }
}