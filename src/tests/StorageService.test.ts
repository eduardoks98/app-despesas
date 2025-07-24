import { StorageService } from '../services/storage/StorageService';
import { Transaction, Installment, Subscription, Category } from '../types';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transactions', () => {
    it('should save and retrieve transactions', async () => {
      const mockTransaction: Transaction = {
        id: '1',
        amount: 100,
        type: 'expense',
        category: 'Alimentação',
        description: 'Almoço',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveTransaction(mockTransaction);
      const transactions = await StorageService.getTransactions();

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual(mockTransaction);
    });

    it('should return empty array when no transactions exist', async () => {
      const transactions = await StorageService.getTransactions();
      expect(transactions).toEqual([]);
    });
  });

  describe('Installments', () => {
    it('should save and retrieve installments', async () => {
      const mockInstallment: Installment = {
        id: '1',
        description: 'Compra parcelada',
        totalAmount: 1000,
        installments: 10,
        currentInstallment: 1,
        amountPerInstallment: 100,
        startDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        category: 'Compras',
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveInstallment(mockInstallment);
      const installments = await StorageService.getInstallments();

      expect(installments).toHaveLength(1);
      expect(installments[0]).toEqual(mockInstallment);
    });
  });

  describe('Subscriptions', () => {
    it('should save and retrieve subscriptions', async () => {
      const mockSubscription: Subscription = {
        id: '1',
        name: 'Netflix',
        amount: 29.90,
        frequency: 'monthly',
        category: 'Lazer',
        startDate: new Date().toISOString(),
        nextDueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await StorageService.saveSubscription(mockSubscription);
      const subscriptions = await StorageService.getSubscriptions();

      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0]).toEqual(mockSubscription);
    });
  });

  describe('Categories', () => {
    it('should return default categories when none exist', async () => {
      const categories = await StorageService.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('icon');
      expect(categories[0]).toHaveProperty('color');
    });
  });
}); 