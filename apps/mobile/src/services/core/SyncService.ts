/**
 * SyncService - Serviço de Sincronização entre Plataformas
 * 
 * Gerencia a sincronização de dados entre SQLite local e API remota
 */

import { DatabaseService, TransactionRepository, CategoryRepository } from './';
import { Transaction, Category } from '../../types';

export interface SyncConfiguration {
  /** URL da API */
  apiUrl: string;
  /** Token de autenticação */
  authToken?: string;
  /** Intervalo de sincronização automática em minutos */
  syncInterval?: number;
  /** Se deve sincronizar automaticamente */
  autoSync?: boolean;
  /** Se deve resolver conflitos automaticamente */
  autoResolveConflicts?: boolean;
}

export interface SyncStatus {
  /** Última sincronização */
  lastSync?: Date;
  /** Se está sincronizando atualmente */
  isSyncing: boolean;
  /** Número de itens pendentes */
  pendingItems: number;
  /** Erro da última sincronização */
  lastError?: string;
  /** Status da conexão */
  isOnline: boolean;
}

export interface SyncResult {
  /** Se a sincronização foi bem-sucedida */
  success: boolean;
  /** Número de itens sincronizados */
  itemsSynced: number;
  /** Número de conflitos resolvidos */
  conflictsResolved: number;
  /** Erro ocorrido */
  error?: string;
  /** Timestamp da sincronização */
  timestamp: Date;
}

export class SyncService {
  private static config: SyncConfiguration | null = null;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static listeners: ((status: SyncStatus) => void)[] = [];
  private static currentStatus: SyncStatus = {
    isSyncing: false,
    pendingItems: 0,
    isOnline: navigator?.onLine ?? true,
  };

  /**
   * Inicializa o serviço de sincronização
   */
  static async initialize(config: SyncConfiguration): Promise<void> {
    this.config = config;
    
    // Configura listeners de rede
    this.setupNetworkListeners();
    
    // Configura sincronização automática se habilitada
    if (config.autoSync && config.syncInterval) {
      this.startAutoSync(config.syncInterval);
    }

    // Primeira verificação de status
    await this.updateStatus();
    
    console.log('✅ SyncService inicializado');
  }

  /**
   * Inicia sincronização automática
   */
  private static startAutoSync(intervalMinutes: number): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.currentStatus.isOnline && !this.currentStatus.isSyncing) {
        await this.syncAll();
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Para sincronização automática
   */
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Configura listeners de rede
   */
  private static setupNetworkListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.currentStatus.isOnline = true;
        this.notifyListeners();
        // Tenta sincronizar quando voltar online
        if (this.config?.autoSync) {
          this.syncAll();
        }
      });

      window.addEventListener('offline', () => {
        this.currentStatus.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  /**
   * Adiciona listener para mudanças de status
   */
  static addStatusListener(listener: (status: SyncStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener de status
   */
  static removeStatusListener(listener: (status: SyncStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifica listeners sobre mudança de status
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  /**
   * Atualiza o status do serviço
   */
  private static async updateStatus(): Promise<void> {
    // Conta itens pendentes de sincronização
    // Aqui poderíamos implementar uma tabela de controle de sincronização
    // Por simplicidade, vamos usar uma implementação básica
    
    this.currentStatus.pendingItems = 0; // TODO: Implementar contagem real
    this.notifyListeners();
  }

  /**
   * Sincroniza todos os dados
   */
  static async syncAll(): Promise<SyncResult> {
    if (!this.config) {
      throw new Error('SyncService não foi inicializado');
    }

    if (!this.currentStatus.isOnline) {
      throw new Error('Sem conexão com a internet');
    }

    this.currentStatus.isSyncing = true;
    this.notifyListeners();

    let itemsSynced = 0;
    let conflictsResolved = 0;
    let error: string | undefined;

    try {
      // Sincroniza categorias
      const categoryResult = await this.syncCategories();
      itemsSynced += categoryResult.itemsSynced;
      conflictsResolved += categoryResult.conflictsResolved;

      // Sincroniza transações
      const transactionResult = await this.syncTransactions();
      itemsSynced += transactionResult.itemsSynced;
      conflictsResolved += transactionResult.conflictsResolved;

      this.currentStatus.lastSync = new Date();
      this.currentStatus.lastError = undefined;

    } catch (err: any) {
      error = err.message;
      this.currentStatus.lastError = error;
      console.error('Erro na sincronização:', err);
    } finally {
      this.currentStatus.isSyncing = false;
      await this.updateStatus();
    }

    const result: SyncResult = {
      success: !error,
      itemsSynced,
      conflictsResolved,
      error,
      timestamp: new Date(),
    };

    return result;
  }

  /**
   * Sincroniza categorias
   */
  private static async syncCategories(): Promise<{ itemsSynced: number; conflictsResolved: number }> {
    if (!this.config?.authToken) {
      throw new Error('Token de autenticação não configurado');
    }

    let itemsSynced = 0;
    let conflictsResolved = 0;

    try {
      // 1. Busca categorias locais
      const localCategories = await CategoryRepository.findAll();
      
      // 2. Busca categorias do servidor
      const response = await fetch(`${this.config.apiUrl}/categories`, {
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar categorias: ${response.status}`);
      }

      const serverCategories: Category[] = await response.json();

      // 3. Resolve diferenças
      for (const serverCategory of serverCategories) {
        const localCategory = localCategories.find(c => c.id === serverCategory.id);
        
        if (!localCategory) {
          // Categoria existe no servidor mas não localmente - adiciona localmente
          await CategoryRepository.save(serverCategory);
          itemsSynced++;
        } else {
          // Categoria existe em ambos - verifica conflitos
          // Por simplicidade, servidor sempre ganha
          if (JSON.stringify(localCategory) !== JSON.stringify(serverCategory)) {
            await CategoryRepository.update(serverCategory);
            conflictsResolved++;
          }
        }
      }

      // 4. Envia categorias locais customizadas para servidor
      const customCategories = localCategories.filter(c => c.isCustom);
      for (const category of customCategories) {
        const exists = serverCategories.find(c => c.id === category.id);
        if (!exists) {
          const response = await fetch(`${this.config.apiUrl}/categories`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(category),
          });

          if (response.ok) {
            itemsSynced++;
          }
        }
      }

    } catch (error) {
      console.error('Erro na sincronização de categorias:', error);
      throw error;
    }

    return { itemsSynced, conflictsResolved };
  }

  /**
   * Sincroniza transações
   */
  private static async syncTransactions(): Promise<{ itemsSynced: number; conflictsResolved: number }> {
    if (!this.config?.authToken) {
      throw new Error('Token de autenticação não configurado');
    }

    let itemsSynced = 0;
    let conflictsResolved = 0;

    try {
      // 1. Busca transações locais (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const localTransactions = await TransactionRepository.findAll({
        startDate: thirtyDaysAgo.toISOString(),
      });

      // 2. Busca transações do servidor
      const response = await fetch(`${this.config.apiUrl}/transactions?startDate=${thirtyDaysAgo.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar transações: ${response.status}`);
      }

      const { transactions: serverTransactions } = await response.json();

      // 3. Resolve diferenças
      for (const serverTransaction of serverTransactions) {
        const localTransaction = localTransactions.find(t => t.id === serverTransaction.id);
        
        if (!localTransaction) {
          // Transação existe no servidor mas não localmente
          await TransactionRepository.save(serverTransaction);
          itemsSynced++;
        } else {
          // Transação existe em ambos - verifica conflitos
          if (JSON.stringify(localTransaction) !== JSON.stringify(serverTransaction)) {
            await TransactionRepository.update(serverTransaction);
            conflictsResolved++;
          }
        }
      }

      // 4. Envia transações locais para servidor
      for (const transaction of localTransactions) {
        const exists = serverTransactions.find((t: Transaction) => t.id === transaction.id);
        if (!exists) {
          const response = await fetch(`${this.config.apiUrl}/transactions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction),
          });

          if (response.ok) {
            itemsSynced++;
          }
        }
      }

    } catch (error) {
      console.error('Erro na sincronização de transações:', error);
      throw error;
    }

    return { itemsSynced, conflictsResolved };
  }

  /**
   * Força sincronização manual
   */
  static async forcSync(): Promise<SyncResult> {
    return this.syncAll();
  }

  /**
   * Obtém status atual
   */
  static getStatus(): SyncStatus {
    return { ...this.currentStatus };
  }

  /**
   * Verifica se há dados pendentes de sincronização
   */
  static async hasPendingSync(): Promise<boolean> {
    // TODO: Implementar verificação real de dados pendentes
    return this.currentStatus.pendingItems > 0;
  }

  /**
   * Limpa dados de sincronização
   */
  static async clearSyncData(): Promise<void> {
    this.currentStatus = {
      isSyncing: false,
      pendingItems: 0,
      isOnline: navigator?.onLine ?? true,
    };
    this.notifyListeners();
  }

  /**
   * Destroi o serviço
   */
  static destroy(): void {
    this.stopAutoSync();
    this.listeners = [];
    this.config = null;
  }
}