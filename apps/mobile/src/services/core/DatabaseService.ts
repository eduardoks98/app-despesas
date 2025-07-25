import * as SQLite from 'expo-sqlite';
import { Transaction, Installment, Category, Subscription } from '../../types';

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'app_despesas.db';
  private static readonly DB_VERSION = 1;

  /**
   * Inicializa a conexão com o banco de dados
   */
  static async initialize(): Promise<void> {
    if (this.db) return;

    try {
      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);
      await this.createTables();
      await this.seedDefaultCategories();
    } catch (error) {
      console.error('Erro ao inicializar banco de dados:', error);
      throw error;
    }
  }

  /**
   * Cria as tabelas necessárias
   */
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Habilitar foreign keys
    await this.db.execAsync('PRAGMA foreign_keys = ON;');

    // Tabela de categorias
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        isCustom INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Tabela de transações
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category) REFERENCES categories(name)
      );
    `);

    // Tabela de parcelamentos
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS installments (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        totalAmount REAL NOT NULL,
        installments INTEGER NOT NULL,
        currentInstallment INTEGER NOT NULL DEFAULT 1,
        amountPerInstallment REAL NOT NULL,
        startDate TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        category TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category) REFERENCES categories(name)
      );
    `);

    // Tabela de assinaturas
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
        category TEXT NOT NULL,
        startDate TEXT NOT NULL,
        nextDueDate TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category) REFERENCES categories(name)
      );
    `);

    // Tabela de configurações
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Índices para melhor performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_installments_dueDate ON installments(dueDate);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_nextDueDate ON subscriptions(nextDueDate);
    `);

    console.log('✅ Tabelas do banco de dados criadas com sucesso');
  }

  /**
   * Semeia categorias padrão se não existirem
   */
  private static async seedDefaultCategories(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existingCategories = await this.db.getAllAsync('SELECT COUNT(*) as count FROM categories');
    const count = (existingCategories[0] as any).count;

    if (count === 0) {
      const defaultCategories = [
        { id: '1', name: 'Alimentação', icon: 'restaurant', color: '#FF6B6B', type: 'expense', isCustom: 0 },
        { id: '2', name: 'Transporte', icon: 'car', color: '#4ECDC4', type: 'expense', isCustom: 0 },
        { id: '3', name: 'Moradia', icon: 'home', color: '#45B7D1', type: 'expense', isCustom: 0 },
        { id: '4', name: 'Saúde', icon: 'medical', color: '#96CEB4', type: 'expense', isCustom: 0 },
        { id: '5', name: 'Educação', icon: 'school', color: '#FECA57', type: 'expense', isCustom: 0 },
        { id: '6', name: 'Lazer', icon: 'game-controller', color: '#9C88FF', type: 'expense', isCustom: 0 },
        { id: '7', name: 'Compras', icon: 'bag', color: '#FD79A8', type: 'expense', isCustom: 0 },
        { id: '8', name: 'Salário', icon: 'briefcase', color: '#A29BFE', type: 'income', isCustom: 0 },
        { id: '9', name: 'Freelance', icon: 'laptop', color: '#74B9FF', type: 'income', isCustom: 0 },
        { id: '10', name: 'Investimentos', icon: 'trending-up', color: '#55A3FF', type: 'income', isCustom: 0 },
      ];

      for (const category of defaultCategories) {
        await this.db.runAsync(
          `INSERT INTO categories (id, name, icon, color, type, isCustom) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [category.id, category.name, category.icon, category.color, category.type, category.isCustom]
        );
      }

      console.log('✅ Categorias padrão inseridas no banco de dados');
    }
  }

  /**
   * Obtém a instância do banco de dados
   */
  static getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Executa uma transação no banco de dados
   */
  static async executeTransaction<T>(
    operations: (db: SQLite.SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execAsync('BEGIN TRANSACTION;');
      const result = await operations(this.db);
      await this.db.execAsync('COMMIT;');
      return result;
    } catch (error) {
      await this.db.execAsync('ROLLBACK;');
      throw error;
    }
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  static async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  /**
   * Remove todos os dados (para desenvolvimento/testes)
   */
  static async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.executeTransaction(async (db) => {
      await db.execAsync('DELETE FROM transactions;');
      await db.execAsync('DELETE FROM installments;');
      await db.execAsync('DELETE FROM subscriptions;');
      await db.execAsync('DELETE FROM categories WHERE isCustom = 1;');
      await db.execAsync('DELETE FROM settings;');
    });

    console.log('🗑️ Todos os dados foram removidos do banco');
  }

  /**
   * Obtém informações sobre o banco de dados
   */
  static async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    size: number;
    tables: string[];
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = await this.db.getAllAsync(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name;
    `);

    // Estimar tamanho (não há uma função direta no SQLite)
    const transactions = await this.db.getAllAsync('SELECT COUNT(*) as count FROM transactions');
    const installments = await this.db.getAllAsync('SELECT COUNT(*) as count FROM installments');
    const subscriptions = await this.db.getAllAsync('SELECT COUNT(*) as count FROM subscriptions');
    const categories = await this.db.getAllAsync('SELECT COUNT(*) as count FROM categories');

    const estimatedSize = 
      ((transactions[0] as any).count * 200) + // ~200 bytes por transação
      ((installments[0] as any).count * 150) + // ~150 bytes por parcelamento
      ((subscriptions[0] as any).count * 100) + // ~100 bytes por assinatura
      ((categories[0] as any).count * 50);      // ~50 bytes por categoria

    return {
      name: this.DB_NAME,
      version: this.DB_VERSION,
      size: estimatedSize,
      tables: (tables as any[]).map(t => t.name),
    };
  }
}