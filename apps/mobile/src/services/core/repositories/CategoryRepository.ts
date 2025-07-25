import { DatabaseService } from '../DatabaseService';
import { Category } from '../../../types';

export class CategoryRepository {
  /**
   * Salva uma nova categoria
   */
  static async save(category: Category): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      `INSERT OR REPLACE INTO categories 
       (id, name, icon, color, type, isCustom, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category.id,
        category.name,
        category.icon,
        category.color,
        category.type,
        category.isCustom ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );
  }

  /**
   * Busca todas as categorias
   */
  static async findAll(options?: {
    type?: 'income' | 'expense';
    isCustom?: boolean;
  }): Promise<Category[]> {
    const db = DatabaseService.getDatabase();
    
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params: any[] = [];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    if (options?.isCustom !== undefined) {
      query += ' AND isCustom = ?';
      params.push(options.isCustom ? 1 : 0);
    }

    query += ' ORDER BY isCustom ASC, name ASC';

    const results = await db.getAllAsync(query, params);
    return results.map(this.mapRowToCategory);
  }

  /**
   * Busca categoria por ID
   */
  static async findById(id: string): Promise<Category | null> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getFirstAsync(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    return result ? this.mapRowToCategory(result) : null;
  }

  /**
   * Busca categoria por nome
   */
  static async findByName(name: string): Promise<Category | null> {
    const db = DatabaseService.getDatabase();
    
    const result = await db.getFirstAsync(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );

    return result ? this.mapRowToCategory(result) : null;
  }

  /**
   * Atualiza uma categoria
   */
  static async update(category: Category): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    await db.runAsync(
      `UPDATE categories 
       SET name = ?, icon = ?, color = ?, type = ?, updatedAt = ?
       WHERE id = ?`,
      [
        category.name,
        category.icon,
        category.color,
        category.type,
        new Date().toISOString(),
        category.id,
      ]
    );
  }

  /**
   * Remove uma categoria (apenas categorias customizadas)
   */
  static async delete(id: string): Promise<void> {
    const db = DatabaseService.getDatabase();
    
    // Primeiro verifica se é uma categoria customizada
    const category = await this.findById(id);
    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    if (!category.isCustom) {
      throw new Error('Não é possível excluir categorias padrão');
    }

    // Verifica se existem transações usando esta categoria
    const transactionCount = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM transactions WHERE category = ?',
      [category.name]
    );

    if ((transactionCount as any).count > 0) {
      throw new Error('Não é possível excluir categoria com transações associadas');
    }

    // Remove a categoria
    await db.runAsync('DELETE FROM categories WHERE id = ? AND isCustom = 1', [id]);
  }

  /**
   * Verifica se um nome de categoria já existe
   */
  static async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const db = DatabaseService.getDatabase();
    
    let query = 'SELECT COUNT(*) as count FROM categories WHERE name = ?';
    const params: any[] = [name];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await db.getFirstAsync(query, params);
    return (result as any).count > 0;
  }

  /**
   * Busca categorias com estatísticas de uso
   */
  static async findWithUsageStats(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<(Category & { 
    transactionCount: number; 
    totalAmount: number; 
    lastUsed?: string;
  })[]> {
    const db = DatabaseService.getDatabase();
    
    let query = `
      SELECT 
        c.*,
        COALESCE(COUNT(t.id), 0) as transactionCount,
        COALESCE(SUM(t.amount), 0) as totalAmount,
        MAX(t.date) as lastUsed
      FROM categories c
      LEFT JOIN transactions t ON c.name = t.category
    `;
    const params: any[] = [];

    if (options?.startDate || options?.endDate) {
      query += ' AND (1=1';
      
      if (options?.startDate) {
        query += ' AND t.date >= ?';
        params.push(options.startDate);
      }

      if (options?.endDate) {
        query += ' AND t.date <= ?';
        params.push(options.endDate);
      }
      
      query += ')';
    }

    query += ' GROUP BY c.id ORDER BY c.isCustom ASC, transactionCount DESC, c.name ASC';

    const results = await db.getAllAsync(query, params);
    
    return results.map(row => ({
      ...this.mapRowToCategory(row),
      transactionCount: (row as any).transactionCount,
      totalAmount: (row as any).totalAmount,
      lastUsed: (row as any).lastUsed,
    }));
  }

  /**
   * Busca categorias mais utilizadas
   */
  static async findMostUsed(options?: {
    type?: 'income' | 'expense';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<(Category & { usageCount: number })[]> {
    const db = DatabaseService.getDatabase();
    
    let query = `
      SELECT 
        c.*,
        COUNT(t.id) as usageCount
      FROM categories c
      INNER JOIN transactions t ON c.name = t.category
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.type) {
      query += ' AND c.type = ?';
      params.push(options.type);
    }

    if (options?.startDate) {
      query += ' AND t.date >= ?';
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ' AND t.date <= ?';
      params.push(options.endDate);
    }

    query += ' GROUP BY c.id ORDER BY usageCount DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const results = await db.getAllAsync(query, params);
    
    return results.map(row => ({
      ...this.mapRowToCategory(row),
      usageCount: (row as any).usageCount,
    }));
  }

  /**
   * Conta total de categorias
   */
  static async count(options?: {
    type?: 'income' | 'expense';
    isCustom?: boolean;
  }): Promise<number> {
    const db = DatabaseService.getDatabase();
    
    let query = 'SELECT COUNT(*) as count FROM categories WHERE 1=1';
    const params: any[] = [];

    if (options?.type) {
      query += ' AND type = ?';
      params.push(options.type);
    }

    if (options?.isCustom !== undefined) {
      query += ' AND isCustom = ?';
      params.push(options.isCustom ? 1 : 0);
    }

    const result = await db.getFirstAsync(query, params);
    return (result as any).count;
  }

  /**
   * Mapeia linha do banco para objeto Category
   */
  private static mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type,
      isCustom: Boolean(row.isCustom),
    };
  }
}