import { DatabaseService } from '../services/core/DatabaseService';
import { TransactionRepository } from '../services/core/repositories/TransactionRepository';
import { CategoryRepository } from '../services/core/repositories/CategoryRepository';
import { Transaction, Category } from '../types';

// Mock do expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    execAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
    closeAsync: jest.fn(),
  })),
}));

describe('DatabaseService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
      closeAsync: jest.fn(),
    };

    // Mock da inicialização do banco
    const SQLite = require('expo-sqlite');
    SQLite.openDatabaseAsync.mockResolvedValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize database and create tables', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]); // No categories exist

      await DatabaseService.initialize();

      expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS categories')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS transactions')
      );
    });

    it('should seed default categories if none exist', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]); // No categories exist

      await DatabaseService.initialize();

      // Should insert default categories
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.arrayContaining(['1', 'Alimentação', 'restaurant', '#FF6B6B', 'expense', 0])
      );
    });

    it('should not seed categories if they already exist', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 5 }]); // Categories exist

      await DatabaseService.initialize();

      // Should not insert categories
      expect(mockDb.runAsync).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.any(Array)
      );
    });
  });

  describe('executeTransaction', () => {
    it('should execute operations within a transaction', async () => {
      const mockOperation = jest.fn().mockResolvedValue('result');

      const result = await DatabaseService.executeTransaction(mockOperation);

      expect(mockDb.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION;');
      expect(mockOperation).toHaveBeenCalledWith(mockDb);
      expect(mockDb.execAsync).toHaveBeenCalledWith('COMMIT;');
      expect(result).toBe('result');
    });

    it('should rollback transaction on error', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      await expect(DatabaseService.executeTransaction(mockOperation)).rejects.toThrow('Test error');

      expect(mockDb.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION;');
      expect(mockDb.execAsync).toHaveBeenCalledWith('ROLLBACK;');
    });
  });

  describe('clearAllData', () => {
    it('should clear all data from tables', async () => {
      await DatabaseService.clearAllData();

      expect(mockDb.execAsync).toHaveBeenCalledWith('BEGIN TRANSACTION;');
      expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM transactions;');
      expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM installments;');
      expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM subscriptions;');
      expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM categories WHERE isCustom = 1;');
      expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM settings;');
      expect(mockDb.execAsync).toHaveBeenCalledWith('COMMIT;');
    });
  });

  describe('getDatabaseInfo', () => {
    it('should return database information', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([
          { name: 'transactions' },
          { name: 'categories' },
          { name: 'installments' },
          { name: 'subscriptions' },
          { name: 'settings' },
        ])
        .mockResolvedValueOnce([{ count: 100 }]) // transactions
        .mockResolvedValueOnce([{ count: 50 }])  // installments
        .mockResolvedValueOnce([{ count: 10 }])  // subscriptions
        .mockResolvedValueOnce([{ count: 15 }]); // categories

      const info = await DatabaseService.getDatabaseInfo();

      expect(info).toEqual({
        name: 'app_despesas.db',
        version: 1,
        size: 22150, // (100*200) + (50*150) + (10*100) + (15*50)
        tables: ['transactions', 'categories', 'installments', 'subscriptions', 'settings'],
      });
    });
  });
});

describe('TransactionRepository', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };

    // Mock DatabaseService.getDatabase()
    jest.spyOn(DatabaseService, 'getDatabase').mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a transaction', async () => {
      const transaction: Transaction = {
        id: '1',
        amount: 100,
        type: 'expense',
        category: 'Alimentação',
        description: 'Almoço',
        date: '2024-01-01',
        createdAt: '2024-01-01T00:00:00Z',
      };

      await TransactionRepository.save(transaction);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO transactions'),
        [
          '1',
          100,
          'expense',
          'Alimentação',
          'Almoço',
          '2024-01-01',
          '2024-01-01T00:00:00Z',
          expect.any(String), // updatedAt
        ]
      );
    });
  });

  describe('findAll', () => {
    it('should find all transactions with filters', async () => {
      const mockRows = [
        {
          id: '1',
          amount: 100,
          type: 'expense',
          category: 'Alimentação',
          description: 'Almoço',
          date: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await TransactionRepository.findAll({
        type: 'expense',
        category: 'Alimentação',
        limit: 10,
      });

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('WHERE 1=1 AND type = ? AND category = ?'),
        ['expense', 'Alimentação', 10]
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockRows[0]);
    });
  });

  describe('getSummary', () => {
    it('should return financial summary', async () => {
      const mockSummary = {
        totalIncome: 1000,
        totalExpense: 600,
        transactionCount: 15,
      };

      mockDb.getFirstAsync.mockResolvedValue(mockSummary);

      const result = await TransactionRepository.getSummary({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(result).toEqual({
        totalIncome: 1000,
        totalExpense: 600,
        balance: 400,
        transactionCount: 15,
      });

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE(SUM(CASE WHEN type = \'income\''),
        ['2024-01-01', '2024-01-31']
      );
    });
  });
});

describe('CategoryRepository', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };

    jest.spyOn(DatabaseService, 'getDatabase').mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a category', async () => {
      const category: Category = {
        id: '1',
        name: 'Nova Categoria',
        icon: 'star',
        color: '#FF0000',
        type: 'expense',
        isCustom: true,
      };

      await CategoryRepository.save(category);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO categories'),
        [
          '1',
          'Nova Categoria',
          'star',
          '#FF0000',
          'expense',
          1, // isCustom = true
          expect.any(String), // createdAt
          expect.any(String), // updatedAt
        ]
      );
    });
  });

  describe('delete', () => {
    it('should delete a custom category', async () => {
      const mockCategory = {
        id: '1',
        name: 'Custom Category',
        isCustom: true,
      };

      mockDb.getFirstAsync
        .mockResolvedValueOnce(mockCategory) // findById
        .mockResolvedValueOnce({ count: 0 });   // transaction count check

      await CategoryRepository.delete('1');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM categories WHERE id = ? AND isCustom = 1',
        ['1']
      );
    });

    it('should not delete a default category', async () => {
      const mockCategory = {
        id: '1',
        name: 'Default Category',
        isCustom: false,
      };

      mockDb.getFirstAsync.mockResolvedValue(mockCategory);

      await expect(CategoryRepository.delete('1')).rejects.toThrow(
        'Não é possível excluir categorias padrão'
      );
    });

    it('should not delete category with associated transactions', async () => {
      const mockCategory = {
        id: '1',
        name: 'Used Category',
        isCustom: true,
      };

      mockDb.getFirstAsync
        .mockResolvedValueOnce(mockCategory) // findById
        .mockResolvedValueOnce({ count: 5 });   // has transactions

      await expect(CategoryRepository.delete('1')).rejects.toThrow(
        'Não é possível excluir categoria com transações associadas'
      );
    });
  });
});