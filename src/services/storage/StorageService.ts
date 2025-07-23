import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Installment, Category, Subscription } from '../../types';
import { NotificationSettings } from '../notifications/NotificationService';

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

export class StorageService {
  // Transações
  static async saveTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    transactions.unshift(transaction);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static async getTransactions(): Promise<Transaction[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  }

  static async setTransactions(transactions: Transaction[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
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
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : this.getDefaultCategories();
  }

  static async saveCategories(categories: Category[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
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
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.BALANCE,
      STORAGE_KEYS.NOTIFICATION_SETTINGS,
      STORAGE_KEYS.THEME
    ]);
  }
}