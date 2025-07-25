import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Installment, Category, Subscription } from '../../types';
import { NotificationSettings } from '../platform';
import { DatabaseService } from './DatabaseService';
import { TransactionRepository } from './repositories/TransactionRepository';
import { CategoryRepository } from './repositories/CategoryRepository';

const STORAGE_KEYS = {
  TRANSACTIONS: '@app_despesas:transactions',
  CATEGORIES: '@app_despesas:categories',
  INSTALLMENTS: '@app_despesas:installments',
  SUBSCRIPTIONS: '@app_despesas:subscriptions',
  USER_PREFERENCES: '@app_despesas:preferences',
  BALANCE: '@app_despesas:balance',
  NOTIFICATION_SETTINGS: '@app_despesas:notification_settings',
  THEME: '@app_despesas:theme'
};

// Flag para controlar se estamos usando SQLite ou AsyncStorage
const USE_SQLITE = true;

export class StorageService {
  /**
   * Inicializa o serviço de storage
   */
  static async initialize(): Promise<void> {
    if (USE_SQLITE) {
      await DatabaseService.initialize();
    }
  }

  // Transações
  static async saveTransaction(transaction: Transaction): Promise<void> {
    if (USE_SQLITE) {
      await TransactionRepository.save(transaction);
    } else {
      const transactions = await this.getTransactions();
      transactions.unshift(transaction);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
  }

  static async getTransactions(): Promise<Transaction[]> {
    if (USE_SQLITE) {
      return await TransactionRepository.findAll({ limit: 1000 });
    } else {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    }
  }

  static async setTransactions(transactions: Transaction[]): Promise<void> {
    if (USE_SQLITE) {
      // Para SQLite, removemos todas e inserimos novamente
      await DatabaseService.executeTransaction(async (db) => {
        await db.execAsync('DELETE FROM transactions');
        for (const transaction of transactions) {
          await TransactionRepository.save(transaction);
        }
      });
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
  }

  /**
   * Busca transações com filtros avançados
   */
  static async getTransactionsWithFilters(options?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    if (USE_SQLITE) {
      return await TransactionRepository.findAll(options);
    } else {
      // Fallback para AsyncStorage com filtros limitados
      let transactions = await this.getTransactions();
      
      if (options?.type) {
        transactions = transactions.filter(t => t.type === options.type);
      }
      
      if (options?.category) {
        transactions = transactions.filter(t => t.category === options.category);
      }
      
      if (options?.startDate) {
        transactions = transactions.filter(t => t.date >= options.startDate!);
      }
      
      if (options?.endDate) {
        transactions = transactions.filter(t => t.date <= options.endDate!);
      }
      
      if (options?.limit) {
        const start = options.offset || 0;
        transactions = transactions.slice(start, start + options.limit);
      }
      
      return transactions;
    }
  }

  /**
   * Atualiza uma transação
   */
  static async updateTransaction(transaction: Transaction): Promise<void> {
    if (USE_SQLITE) {
      await TransactionRepository.update(transaction);
    } else {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === transaction.id);
      if (index !== -1) {
        transactions[index] = transaction;
        await this.setTransactions(transactions);
      }
    }
  }

  /**
   * Remove uma transação
   */
  static async deleteTransaction(id: string): Promise<void> {
    if (USE_SQLITE) {
      await TransactionRepository.delete(id);
    } else {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter(t => t.id !== id);
      await this.setTransactions(filtered);
    }
  }

  /**
   * Obtém resumo financeiro
   */
  static async getFinancialSummary(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  }> {
    if (USE_SQLITE) {
      return await TransactionRepository.getSummary(options);
    } else {
      const transactions = await this.getTransactionsWithFilters(options);
      
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length,
      };
    }
  }

  // Parcelamentos
  static async saveInstallment(installment: Installment): Promise<void> {
    const installments = await this.getInstallments();
    installments.push(installment);
    await AsyncStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments));
  }

  static async getInstallments(): Promise<Installment[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INSTALLMENTS);
    return data ? JSON.parse(data) : [];
  }

  static async setInstallments(installments: Installment[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.INSTALLMENTS, JSON.stringify(installments));
  }

  // Assinaturas
  static async saveSubscription(subscription: Subscription): Promise<void> {
    const subscriptions = await this.getSubscriptions();
    subscriptions.push(subscription);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  }

  static async getSubscriptions(): Promise<Subscription[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    return data ? JSON.parse(data) : [];
  }

  static async updateSubscription(subscription: Subscription): Promise<void> {
    const subscriptions = await this.getSubscriptions();
    const index = subscriptions.findIndex(s => s.id === subscription.id);
    if (index !== -1) {
      subscriptions[index] = subscription;
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    }
  }

  static async deleteSubscription(id: string): Promise<void> {
    const subscriptions = await this.getSubscriptions();
    const filtered = subscriptions.filter(s => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(filtered));
  }

  static async setSubscriptions(subscriptions: Subscription[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
  }

  // Categorias
  static async getCategories(): Promise<Category[]> {
    if (USE_SQLITE) {
      return await CategoryRepository.findAll();
    } else {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : this.getDefaultCategories();
    }
  }

  static async saveCategories(categories: Category[]): Promise<void> {
    if (USE_SQLITE) {
      // Para SQLite, salvamos cada categoria individualmente
      for (const category of categories) {
        await CategoryRepository.save(category);
      }
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
  }

  /**
   * Salva uma categoria individual
   */
  static async saveCategory(category: Category): Promise<void> {
    if (USE_SQLITE) {
      await CategoryRepository.save(category);
    } else {
      const categories = await this.getCategories();
      const index = categories.findIndex(c => c.id === category.id);
      if (index !== -1) {
        categories[index] = category;
      } else {
        categories.push(category);
      }
      await this.saveCategories(categories);
    }
  }

  /**
   * Remove uma categoria
   */
  static async deleteCategory(id: string): Promise<void> {
    if (USE_SQLITE) {
      await CategoryRepository.delete(id);
    } else {
      const categories = await this.getCategories();
      const filtered = categories.filter(c => c.id !== id);
      await this.saveCategories(filtered);
    }
  }

  /**
   * Busca categorias por tipo
   */
  static async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    if (USE_SQLITE) {
      return await CategoryRepository.findAll({ type });
    } else {
      const categories = await this.getCategories();
      return categories.filter(c => c.type === type);
    }
  }

  /**
   * Busca categorias com estatísticas de uso
   */
  static async getCategoriesWithStats(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<(Category & { 
    transactionCount: number; 
    totalAmount: number; 
    lastUsed?: string;
  })[]> {
    if (USE_SQLITE) {
      return await CategoryRepository.findWithUsageStats(options);
    } else {
      // Fallback simples para AsyncStorage
      const categories = await this.getCategories();
      const transactions = await this.getTransactionsWithFilters(options);
      
      return categories.map(category => {
        const categoryTransactions = transactions.filter(t => t.category === category.name);
        const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        const lastUsed = categoryTransactions.length > 0 
          ? categoryTransactions.sort((a, b) => b.date.localeCompare(a.date))[0].date
          : undefined;
        
        return {
          ...category,
          transactionCount: categoryTransactions.length,
          totalAmount,
          lastUsed,
        };
      });
    }
  }

  static getDefaultCategories(): Category[] {
    return [
      { id: '1', name: 'Alimentação', icon: 'restaurant', color: '#FF6B6B', type: 'expense', isCustom: false },
      { id: '2', name: 'Transporte', icon: 'car', color: '#4ECDC4', type: 'expense', isCustom: false },
      { id: '3', name: 'Moradia', icon: 'home', color: '#45B7D1', type: 'expense', isCustom: false },
      { id: '4', name: 'Saúde', icon: 'medical', color: '#96CEB4', type: 'expense', isCustom: false },
      { id: '5', name: 'Educação', icon: 'school', color: '#FECA57', type: 'expense', isCustom: false },
      { id: '6', name: 'Lazer', icon: 'game-controller', color: '#9C88FF', type: 'expense', isCustom: false },
      { id: '7', name: 'Compras', icon: 'bag', color: '#FD79A8', type: 'expense', isCustom: false },
      { id: '8', name: 'Salário', icon: 'briefcase', color: '#A29BFE', type: 'income', isCustom: false },
      { id: '9', name: 'Freelance', icon: 'laptop', color: '#74B9FF', type: 'income', isCustom: false },
      { id: '10', name: 'Investimentos', icon: 'trending-up', color: '#55A3FF', type: 'income', isCustom: false },
    ];
  }

  // Backup completo
  static async exportData(): Promise<string> {
    const data = {
      transactions: await this.getTransactions(),
      installments: await this.getInstallments(),
      categories: await this.getCategories(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions || [])],
      [STORAGE_KEYS.INSTALLMENTS, JSON.stringify(data.installments || [])],
      [STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories || [])]
    ]);
  }

  // Configurações de notificação
  static async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
  }

  static async getNotificationSettings(): Promise<NotificationSettings | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    return data ? JSON.parse(data) : null;
  }

  // Preferências do usuário
  static async saveUserPreference(key: string, value: any): Promise<void> {
    const preferences = await this.getUserPreferences();
    preferences[key] = value;
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  }

  static async getUserPreference(key: string): Promise<any> {
    const preferences = await this.getUserPreferences();
    return preferences[key];
  }

  static async getUserPreferences(): Promise<Record<string, any>> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : {};
  }

  // Tema
  static async saveTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  static async getTheme(): Promise<'light' | 'dark' | 'system' | null> {
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return theme as 'light' | 'dark' | 'system' | null;
  }

  // Configurações de haptic feedback
  static async saveHapticEnabled(enabled: boolean): Promise<void> {
    await this.saveUserPreference('hapticEnabled', enabled);
  }

  static async getHapticEnabled(): Promise<boolean> {
    const enabled = await this.getUserPreference('hapticEnabled');
    return enabled !== undefined ? enabled : true; // Default habilitado
  }

  // Limpar dados
  static async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.INSTALLMENTS,
      STORAGE_KEYS.SUBSCRIPTIONS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.BALANCE,
      STORAGE_KEYS.NOTIFICATION_SETTINGS,
      STORAGE_KEYS.THEME
    ]);
  }
}