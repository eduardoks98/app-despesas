import { DatabaseService } from '../DatabaseService';
import { Transaction } from '../../../types';

export class TransactionRepository {
  /**
   * Salva uma nova transação
   */
  static async save(transaction: Transaction): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO transactions 
       (id, amount, type, category, description, date, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.amount,
        transaction.type,
        transaction.category,
        transaction.description,
        transaction.date,
        transaction.createdAt || new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
  }

  /**
   * Busca todas as transações
   */
  static async findAll(options?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const db = DatabaseService.getDatabase();
    
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    if (options?.category) {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options?.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    query += ' ORDER BY date DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      
      if (options?.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const results = await db.getAllAsync(query, params);
    return results.map(this.mapRowToTransaction);
  }

  /**
   * Busca transação por ID
   */
  static async findById(id: string): Promise<Transaction | null> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getFirstAsync(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    return result ? this.mapRowToTransaction(result) : null;
  }

  /**
   * Atualiza uma transação
   */
  static async update(transaction: Transaction): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      `UPDATE transactions 
       SET amount = ?, type = ?, category = ?, description = ?, date = ?, updatedAt = ?
       WHERE id = ?`,
      [
        transaction.amount,
        transaction.type,
        transaction.category,
        transaction.description,
        transaction.date,
        new Date().toISOString(),
        transaction.id,
      ]
    );
  }

  /**
   * Remove uma transação
   */
  static async delete(id: string): Promise<void> {
    const db = DatabaseService.getDatabase();
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  }

  /**
   * Remove múltiplas transações
   */
  static async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const db = DatabaseService.getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    
    await db.runAsync(
      `DELETE FROM transactions WHERE id IN (${placeholders})`,
      ids
    );
  }

  /**
   * Conta total de transações
   */
  static async count(options?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    const db = DatabaseService.getDatabase();
    
    let query = 'SELECT COUNT(*) as count FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    if (options?.category) {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options?.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    const result = await db.getFirstAsync(query, params);
    return (result as any).count;
  }

  /**
   * Calcula soma total das transações
   */
  static async sum(options?: {
    type?: 'income' | 'expense';
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    const db = DatabaseService.getDatabase();
    
    let query = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    if (options?.category) {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options?.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    const result = await db.getFirstAsync(query, params);
    return (result as any).total;
  }

  /**
   * Busca transações agrupadas por categoria
   */
  static async findGroupedByCategory(options?: {
    type?: 'income' | 'expense';
    startDate?: string;
    endDate?: string;
  }): Promise<{ category: string; total: number; count: number }[]> {
    const db = DatabaseService.getDatabase();
    
    let query = `
      SELECT category, 
             SUM(amount) as total, 
             COUNT(*) as count 
      FROM transactions 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    if (options?.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    query += ' GROUP BY category ORDER BY total DESC';

    const results = await db.getAllAsync(query, params);
    return results.map(row => ({
      category: (row as any).category,
      total: (row as any).total,
      count: (row as any).count,
    }));
  }

  /**
   * Busca resumo financeiro
   */
  static async getSummary(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionCount: number;
  }> {
    const db = DatabaseService.getDatabase();
    
    let query = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
        COUNT(*) as transactionCount
      FROM transactions 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    const result = await db.getFirstAsync(query, params);
    const data = result as any;
    
    return {
      totalIncome: data.totalIncome,
      totalExpense: data.totalExpense,
      balance: data.totalIncome - data.totalExpense,
      transactionCount: data.transactionCount,
    };
  }

  /**
   * Mapeia linha do banco para objeto Transaction
   */
  private static mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      amount: row.amount,
      type: row.type,
      category: row.category,
      description: row.description,
      date: row.date,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}