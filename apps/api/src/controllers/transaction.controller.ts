import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { validateAmount, validateDate, validateUUID } from '../utils/validation';

interface CreateTransactionRequest {
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  categoryId: string;
  tags?: string[];
  notes?: string;
  installmentId?: string;
  subscriptionId?: string;
}

export class TransactionController {
  private db = Database.getInstance();

  /**
   * @swagger
   * /api/transactions:
   *   get:
   *     summary: Listar transações
   *     description: Lista transações do usuário com filtros e paginação (requer premium)
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [income, expense]
   *         description: Filtrar por tipo de transação
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtrar por categoria
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data inicial (YYYY-MM-DD)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Data final (YYYY-MM-DD)
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Buscar em descrição e notas
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Página dos resultados
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 50
   *         description: Itens por página
   *     responses:
   *       200:
   *         description: Lista de transações com totais e paginação
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 transactions:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Transaction'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *                 summary:
   *                   type: object
   *                   properties:
   *                     totalIncome:
   *                       type: number
   *                     totalExpense:
   *                       type: number
   *                     balance:
   *                       type: number
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       402:
   *         $ref: '#/components/responses/PremiumRequired'
   */
  public getTransactions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        type,
        categoryId,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 50
      } = req.query;

      let whereClause = 'WHERE t.user_id = ?';
      const params: any[] = [req.user!.id];

      // Build filters
      if (type && (type === 'income' || type === 'expense')) {
        whereClause += ' AND t.type = ?';
        params.push(type);
      }

      if (categoryId && validateUUID(categoryId as string)) {
        whereClause += ' AND t.category_id = ?';
        params.push(categoryId);
      }

      if (startDate && endDate) {
        whereClause += ' AND t.date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      if (search) {
        whereClause += ' AND (t.description LIKE ? OR t.notes LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Calculate offset
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      const offset = (pageNum - 1) * limitNum;

      // Get transactions with category info
      const transactions = await this.db.query(`
        SELECT 
          t.id,
          t.amount,
          t.description,
          t.date,
          t.type,
          t.tags,
          t.notes,
          t.is_recurring,
          t.installment_id,
          t.subscription_id,
          t.created_at,
          t.updated_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ${whereClause}
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limitNum, offset]);

      // Get total count for pagination
      const [countResult] = await this.db.query(`
        SELECT COUNT(*) as total
        FROM transactions t
        ${whereClause}
      `, params);

      // Calculate totals for the filtered results
      const [totalsResult] = await this.db.query(`
        SELECT 
          SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
          SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense
        FROM transactions t
        ${whereClause}
      `, params);

      const totalIncome = parseFloat(totalsResult.total_income) || 0;
      const totalExpense = parseFloat(totalsResult.total_expense) || 0;

      res.json({
        transactions: transactions.map(t => ({
          ...t,
          tags: t.tags ? JSON.parse(t.tags) : [],
          amount: parseFloat(t.amount),
          category: {
            name: t.category_name,
            icon: t.category_icon,
            color: t.category_color
          }
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limitNum)
        },
        summary: {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense
        }
      });

      // Log analytics
      await this.logAnalytics(req.user!.id, 'transactions_viewed', 'transaction', req);

    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * @swagger
   * /api/transactions:
   *   post:
   *     summary: Criar transação
   *     description: Cria uma nova transação (requer premium)
   *     tags: [Transactions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *               - description
   *               - date
   *               - type
   *               - categoryId
   *             properties:
   *               amount:
   *                 type: number
   *                 multipleOf: 0.01
   *                 minimum: 0
   *                 example: 85.50
   *               description:
   *                 type: string
   *                 minLength: 1
   *                 maxLength: 200
   *                 example: Compra no supermercado
   *               date:
   *                 type: string
   *                 format: date
   *                 example: 2025-01-25
   *               type:
   *                 type: string
   *                 enum: [income, expense]
   *                 example: expense
   *               categoryId:
   *                 type: string
   *                 format: uuid
   *                 example: 123e4567-e89b-12d3-a456-426614174000
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["mercado", "alimentação"]
   *               notes:
   *                 type: string
   *                 example: Compras da semana
   *     responses:
   *       201:
   *         description: Transação criada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Transaction created successfully
   *                 transaction:
   *                   $ref: '#/components/schemas/Transaction'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       402:
   *         $ref: '#/components/responses/PremiumRequired'
   *       404:
   *         description: Categoria não encontrada
   */
  public createTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        amount,
        description,
        date,
        type,
        categoryId,
        tags = [],
        notes,
        installmentId,
        subscriptionId
      }: CreateTransactionRequest = req.body;

      // Validation
      if (!validateAmount(amount)) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: 'Description is required' });
      }

      if (!validateDate(date)) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ error: 'Type must be income or expense' });
      }

      if (!validateUUID(categoryId)) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      // Verify category belongs to user
      const category = await this.db.queryOne(`
        SELECT id, name, icon, color 
        FROM categories 
        WHERE id = ? AND user_id = ?
      `, [categoryId, req.user!.id]);

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Verify installment if provided
      if (installmentId) {
        if (!validateUUID(installmentId)) {
          return res.status(400).json({ error: 'Invalid installment ID' });
        }

        const installment = await this.db.queryOne(`
          SELECT id FROM installments 
          WHERE id = ? AND user_id = ?
        `, [installmentId, req.user!.id]);

        if (!installment) {
          return res.status(404).json({ error: 'Installment not found' });
        }
      }

      // Create transaction
      const transactionId = uuidv4();
      await this.db.query(`
        INSERT INTO transactions (
          id, user_id, amount, description, date, type, category_id,
          tags, notes, installment_id, subscription_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transactionId,
        req.user!.id,
        amount.toFixed(2),
        description.trim(),
        date,
        type,
        categoryId,
        JSON.stringify(tags),
        notes?.trim() || null,
        installmentId || null,
        subscriptionId || null
      ]);

      // Get created transaction with category info
      const transaction = await this.db.queryOne(`
        SELECT 
          t.*,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `, [transactionId]);

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction: {
          ...transaction,
          tags: JSON.parse(transaction.tags || '[]'),
          amount: parseFloat(transaction.amount),
          category: {
            name: transaction.category_name,
            icon: transaction.category_icon,
            color: transaction.category_color
          }
        }
      });

      // Log analytics
      await this.logAnalytics(req.user!.id, 'transaction_created', 'transaction', req, {
        type,
        amount
      });

    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        amount,
        description,
        date,
        categoryId,
        tags,
        notes
      } = req.body;

      if (!validateUUID(id)) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
      }

      // Check if transaction exists and belongs to user
      const existingTransaction = await this.db.queryOne(`
        SELECT id FROM transactions 
        WHERE id = ? AND user_id = ?
      `, [id, req.user!.id]);

      if (!existingTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Build update query dynamically
      const updates: string[] = [];
      const params: any[] = [];

      if (amount !== undefined) {
        if (!validateAmount(amount)) {
          return res.status(400).json({ error: 'Invalid amount' });
        }
        updates.push('amount = ?');
        params.push(amount.toFixed(2));
      }

      if (description !== undefined) {
        if (!description || description.trim().length === 0) {
          return res.status(400).json({ error: 'Description is required' });
        }
        updates.push('description = ?');
        params.push(description.trim());
      }

      if (date !== undefined) {
        if (!validateDate(date)) {
          return res.status(400).json({ error: 'Invalid date format' });
        }
        updates.push('date = ?');
        params.push(date);
      }

      if (categoryId !== undefined) {
        if (!validateUUID(categoryId)) {
          return res.status(400).json({ error: 'Invalid category ID' });
        }

        const category = await this.db.queryOne(`
          SELECT id FROM categories 
          WHERE id = ? AND user_id = ?
        `, [categoryId, req.user!.id]);

        if (!category) {
          return res.status(404).json({ error: 'Category not found' });
        }

        updates.push('category_id = ?');
        params.push(categoryId);
      }

      if (tags !== undefined) {
        updates.push('tags = ?');
        params.push(JSON.stringify(tags));
      }

      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes?.trim() || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Update transaction
      await this.db.query(`
        UPDATE transactions 
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `, [...params, id, req.user!.id]);

      // Get updated transaction
      const transaction = await this.db.queryOne(`
        SELECT 
          t.*,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `, [id]);

      res.json({
        message: 'Transaction updated successfully',
        transaction: {
          ...transaction,
          tags: JSON.parse(transaction.tags || '[]'),
          amount: parseFloat(transaction.amount),
          category: {
            name: transaction.category_name,
            icon: transaction.category_icon,
            color: transaction.category_color
          }
        }
      });

      // Log analytics
      await this.logAnalytics(req.user!.id, 'transaction_updated', 'transaction', req);

    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!validateUUID(id)) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
      }

      // Check if transaction exists and belongs to user
      const existingTransaction = await this.db.queryOne(`
        SELECT id FROM transactions 
        WHERE id = ? AND user_id = ?
      `, [id, req.user!.id]);

      if (!existingTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Delete transaction
      await this.db.query(`
        DELETE FROM transactions 
        WHERE id = ? AND user_id = ?
      `, [id, req.user!.id]);

      res.json({ message: 'Transaction deleted successfully' });

      // Log analytics
      await this.logAnalytics(req.user!.id, 'transaction_deleted', 'transaction', req);

    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  private async logAnalytics(userId: string, action: string, entityType: string, req: AuthenticatedRequest, metadata?: any): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO usage_analytics (id, user_id, action, entity_type, metadata, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(),
        userId,
        action,
        entityType,
        metadata ? JSON.stringify(metadata) : null,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      ]);
    } catch (error) {
      console.error('Analytics logging error:', error);
    }
  }
}