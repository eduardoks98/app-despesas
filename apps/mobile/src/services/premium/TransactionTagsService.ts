/**
 * Transaction Tags Service - Premium feature for tags and notes in transactions
 */

import { DatabaseService } from '../core/DatabaseService';
import { AuthenticationService } from '../core/AuthenticationService';
import { AnalyticsService } from '../core/AnalyticsService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface TransactionTag {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  isSystem: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionNote {
  id: string;
  transactionId: string;
  content: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaggedTransaction {
  transactionId: string;
  tags: TransactionTag[];
  notes: TransactionNote[];
}

export interface TagStats {
  totalTags: number;
  mostUsedTags: Array<{
    tagId: string;
    tagName: string;
    usageCount: number;
    totalAmount: number;
  }>;
  tagsByCategory: Array<{
    categoryName: string;
    tags: string[];
  }>;
  unusedTags: string[];
}

const SYSTEM_TAGS: Omit<TransactionTag, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Recorrente',
    color: '#3B82F6',
    icon: 'repeat-outline',
    description: 'Despesa ou receita recorrente',
    isSystem: true,
  },
  {
    name: 'Emergência',
    color: '#EF4444',
    icon: 'warning-outline',
    description: 'Gasto de emergência',
    isSystem: true,
  },
  {
    name: 'Investimento',
    color: '#10B981',
    icon: 'trending-up-outline',
    description: 'Investimento ou aplicação',
    isSystem: true,
  },
  {
    name: 'Reembolsável',
    color: '#F59E0B',
    icon: 'refresh-outline',
    description: 'Gasto que será reembolsado',
    isSystem: true,
  },
  {
    name: 'Trabalho',
    color: '#8B5CF6',
    icon: 'briefcase-outline',
    description: 'Relacionado ao trabalho',
    isSystem: true,
  },
  {
    name: 'Pessoal',
    color: '#EC4899',
    icon: 'person-outline',
    description: 'Gasto pessoal',
    isSystem: true,
  },
  {
    name: 'Família',
    color: '#14B8A6',
    icon: 'people-outline',
    description: 'Gasto familiar',
    isSystem: true,
  },
  {
    name: 'Desconto',
    color: '#22C55E',
    icon: 'pricetag-outline',
    description: 'Compra com desconto',
    isSystem: true,
  },
];

export class TransactionTagsService {
  private static instance: TransactionTagsService;
  private dbService: DatabaseService;
  private authService: AuthenticationService;
  private analyticsService: AnalyticsService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.authService = AuthenticationService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): TransactionTagsService {
    if (!TransactionTagsService.instance) {
      TransactionTagsService.instance = new TransactionTagsService();
    }
    return TransactionTagsService.instance;
  }

  /**
   * Initialize tags service with system tags
   */
  async initialize(): Promise<void> {
    try {
      // Create system tags if they don't exist
      for (const systemTag of SYSTEM_TAGS) {
        const existingTag = await this.dbService.queryOne(
          'SELECT id FROM tags WHERE name = ? AND isSystem = 1',
          [systemTag.name]
        );

        if (!existingTag) {
          const tagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date().toISOString();

          await this.dbService.query(
            `INSERT INTO tags (id, name, color, icon, description, isSystem, usageCount, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)`,
            [
              tagId,
              systemTag.name,
              systemTag.color,
              systemTag.icon || null,
              systemTag.description || null,
              now,
              now,
            ]
          );
        }
      }

      logger.info('Transaction tags service initialized');
    } catch (error) {
      logger.error('Failed to initialize transaction tags service', { error });
    }
  }

  /**
   * Add tags to transaction (Premium only)
   */
  async addTagsToTransaction(transactionId: string, tagIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Transaction tags are a premium feature' };
      }

      // Verify transaction exists
      const transaction = await this.dbService.queryOne(
        'SELECT id FROM transactions WHERE id = ?',
        [transactionId]
      );

      if (!transaction) {
        return { success: false, error: 'Transaction not found' };
      }

      // Remove existing tags for this transaction
      await this.dbService.query(
        'DELETE FROM transaction_tags WHERE transactionId = ?',
        [transactionId]
      );

      // Add new tags
      for (const tagId of tagIds) {
        await this.dbService.query(
          'INSERT INTO transaction_tags (transactionId, tagId) VALUES (?, ?)',
          [transactionId, tagId]
        );

        // Update tag usage count
        await this.dbService.query(
          'UPDATE tags SET usageCount = usageCount + 1, updatedAt = ? WHERE id = ?',
          [new Date().toISOString(), tagId]
        );
      }

      // Track analytics
      await this.analyticsService.track('transaction_tagged', {
        transactionId,
        tagsCount: tagIds.length,
        tagIds,
      });

      logger.info('Tags added to transaction', { transactionId, tagIds });

      return { success: true };
    } catch (error) {
      logger.error('Failed to add tags to transaction', { transactionId, error });
      return { success: false, error: 'Failed to add tags' };
    }
  }

  /**
   * Remove tags from transaction (Premium only)
   */
  async removeTagsFromTransaction(transactionId: string, tagIds?: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Transaction tags are a premium feature' };
      }

      if (tagIds && tagIds.length > 0) {
        // Remove specific tags
        for (const tagId of tagIds) {
          await this.dbService.query(
            'DELETE FROM transaction_tags WHERE transactionId = ? AND tagId = ?',
            [transactionId, tagId]
          );

          // Update tag usage count
          await this.dbService.query(
            'UPDATE tags SET usageCount = CASE WHEN usageCount > 0 THEN usageCount - 1 ELSE 0 END, updatedAt = ? WHERE id = ?',
            [new Date().toISOString(), tagId]
          );
        }
      } else {
        // Remove all tags from transaction
        const currentTags = await this.dbService.query(
          'SELECT tagId FROM transaction_tags WHERE transactionId = ?',
          [transactionId]
        );

        await this.dbService.query(
          'DELETE FROM transaction_tags WHERE transactionId = ?',
          [transactionId]
        );

        // Update usage counts
        for (const tag of currentTags) {
          await this.dbService.query(
            'UPDATE tags SET usageCount = CASE WHEN usageCount > 0 THEN usageCount - 1 ELSE 0 END, updatedAt = ? WHERE id = ?',
            [new Date().toISOString(), tag.tagId]
          );
        }
      }

      // Track analytics
      await this.analyticsService.track('transaction_untagged', {
        transactionId,
        tagsRemoved: tagIds?.length || 'all',
      });

      logger.info('Tags removed from transaction', { transactionId, tagIds });

      return { success: true };
    } catch (error) {
      logger.error('Failed to remove tags from transaction', { transactionId, error });
      return { success: false, error: 'Failed to remove tags' };
    }
  }

  /**
   * Add note to transaction (Premium only)
   */
  async addNoteToTransaction(transactionId: string, content: string, attachments?: string[]): Promise<{ success: boolean; noteId?: string; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Transaction notes are a premium feature' };
      }

      // Verify transaction exists
      const transaction = await this.dbService.queryOne(
        'SELECT id FROM transactions WHERE id = ?',
        [transactionId]
      );

      if (!transaction) {
        return { success: false, error: 'Transaction not found' };
      }

      const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await this.dbService.query(
        `INSERT INTO transaction_notes (id, transactionId, content, attachments, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          transactionId,
          content,
          attachments ? JSON.stringify(attachments) : null,
          now,
          now,
        ]
      );

      // Track analytics
      await this.analyticsService.track('transaction_note_added', {
        transactionId,
        noteId,
        hasAttachments: !!attachments?.length,
        attachmentCount: attachments?.length || 0,
      });

      logger.info('Note added to transaction', { transactionId, noteId });

      return { success: true, noteId };
    } catch (error) {
      logger.error('Failed to add note to transaction', { transactionId, error });
      return { success: false, error: 'Failed to add note' };
    }
  }

  /**
   * Update transaction note (Premium only)
   */
  async updateTransactionNote(noteId: string, content: string, attachments?: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Transaction notes are a premium feature' };
      }

      await this.dbService.query(
        `UPDATE transaction_notes 
         SET content = ?, attachments = ?, updatedAt = ?
         WHERE id = ?`,
        [
          content,
          attachments ? JSON.stringify(attachments) : null,
          new Date().toISOString(),
          noteId,
        ]
      );

      // Track analytics
      await this.analyticsService.track('transaction_note_updated', {
        noteId,
        hasAttachments: !!attachments?.length,
      });

      logger.info('Transaction note updated', { noteId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update transaction note', { noteId, error });
      return { success: false, error: 'Failed to update note' };
    }
  }

  /**
   * Delete transaction note (Premium only)
   */
  async deleteTransactionNote(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Transaction notes are a premium feature' };
      }

      await this.dbService.query(
        'DELETE FROM transaction_notes WHERE id = ?',
        [noteId]
      );

      // Track analytics
      await this.analyticsService.track('transaction_note_deleted', { noteId });

      logger.info('Transaction note deleted', { noteId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete transaction note', { noteId, error });
      return { success: false, error: 'Failed to delete note' };
    }
  }

  /**
   * Create custom tag (Premium only)
   */
  async createCustomTag(tag: Omit<TransactionTag, 'id' | 'isSystem' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; tagId?: string; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Custom tags are a premium feature' };
      }

      // Check if tag name already exists
      const existingTag = await this.dbService.queryOne(
        'SELECT id FROM tags WHERE name = ?',
        [tag.name]
      );

      if (existingTag) {
        return { success: false, error: 'Tag name already exists' };
      }

      const tagId = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await this.dbService.query(
        `INSERT INTO tags (id, name, color, icon, description, isSystem, usageCount, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
        [
          tagId,
          tag.name,
          tag.color,
          tag.icon || null,
          tag.description || null,
          now,
          now,
        ]
      );

      // Track analytics
      await this.analyticsService.track('custom_tag_created', {
        tagId,
        tagName: tag.name,
      });

      logger.info('Custom tag created', { tagId, name: tag.name });

      return { success: true, tagId };
    } catch (error) {
      logger.error('Failed to create custom tag', { error });
      return { success: false, error: 'Failed to create tag' };
    }
  }

  /**
   * Get all tags
   */
  async getAllTags(): Promise<TransactionTag[]> {
    try {
      const tags = await this.dbService.query(
        'SELECT * FROM tags ORDER BY isSystem DESC, usageCount DESC, name ASC'
      );

      return tags.map(tag => ({
        ...tag,
        isSystem: Boolean(tag.isSystem),
      }));
    } catch (error) {
      logger.error('Failed to get tags', { error });
      return [];
    }
  }

  /**
   * Get tags for specific transaction
   */
  async getTransactionTags(transactionId: string): Promise<TransactionTag[]> {
    try {
      const tags = await this.dbService.query(`
        SELECT t.*
        FROM tags t
        INNER JOIN transaction_tags tt ON t.id = tt.tagId
        WHERE tt.transactionId = ?
        ORDER BY t.name ASC
      `, [transactionId]);

      return tags.map(tag => ({
        ...tag,
        isSystem: Boolean(tag.isSystem),
      }));
    } catch (error) {
      logger.error('Failed to get transaction tags', { transactionId, error });
      return [];
    }
  }

  /**
   * Get notes for specific transaction
   */
  async getTransactionNotes(transactionId: string): Promise<TransactionNote[]> {
    try {
      const notes = await this.dbService.query(
        'SELECT * FROM transaction_notes WHERE transactionId = ? ORDER BY createdAt DESC',
        [transactionId]
      );

      return notes.map(note => ({
        ...note,
        attachments: note.attachments ? JSON.parse(note.attachments) : [],
      }));
    } catch (error) {
      logger.error('Failed to get transaction notes', { transactionId, error });
      return [];
    }
  }

  /**
   * Search transactions by tags
   */
  async searchByTags(tagIds: string[]): Promise<string[]> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return [];
      }

      if (tagIds.length === 0) {
        return [];
      }

      const placeholders = tagIds.map(() => '?').join(',');
      const transactions = await this.dbService.query(`
        SELECT DISTINCT transactionId
        FROM transaction_tags
        WHERE tagId IN (${placeholders})
      `, tagIds);

      return transactions.map(t => t.transactionId);
    } catch (error) {
      logger.error('Failed to search by tags', { tagIds, error });
      return [];
    }
  }

  /**
   * Get tag statistics
   */
  async getTagStats(): Promise<TagStats> {
    try {
      // Get total tags count
      const totalTags = await this.dbService.queryOne(
        'SELECT COUNT(*) as count FROM tags'
      );

      // Get most used tags
      const mostUsed = await this.dbService.query(`
        SELECT 
          t.id as tagId,
          t.name as tagName,
          t.usageCount,
          COALESCE(SUM(tr.amount), 0) as totalAmount
        FROM tags t
        LEFT JOIN transaction_tags tt ON t.id = tt.tagId
        LEFT JOIN transactions tr ON tt.transactionId = tr.id
        WHERE t.usageCount > 0
        GROUP BY t.id, t.name, t.usageCount
        ORDER BY t.usageCount DESC
        LIMIT 10
      `);

      // Get tags by category
      const tagsByCategory = await this.dbService.query(`
        SELECT 
          c.name as categoryName,
          GROUP_CONCAT(t.name) as tags
        FROM categories c
        INNER JOIN transactions tr ON c.id = tr.categoryId
        INNER JOIN transaction_tags tt ON tr.id = tt.transactionId
        INNER JOIN tags t ON tt.tagId = t.id
        GROUP BY c.id, c.name
        ORDER BY c.name
      `);

      // Get unused tags
      const unused = await this.dbService.query(
        'SELECT id FROM tags WHERE usageCount = 0 AND isSystem = 0'
      );

      return {
        totalTags: totalTags?.count || 0,
        mostUsedTags: mostUsed || [],
        tagsByCategory: tagsByCategory.map(item => ({
          categoryName: item.categoryName,
          tags: item.tags ? item.tags.split(',') : [],
        })) || [],
        unusedTags: unused.map(u => u.id) || [],
      };
    } catch (error) {
      logger.error('Failed to get tag stats', { error });
      return {
        totalTags: 0,
        mostUsedTags: [],
        tagsByCategory: [],
        unusedTags: [],
      };
    }
  }

  /**
   * Get suggested tags based on transaction data
   */
  async getSuggestedTags(transactionData: {
    description: string;
    amount: number;
    categoryId: string;
  }): Promise<TransactionTag[]> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return [];
      }

      // Get tags commonly used with this category
      const categoryTags = await this.dbService.query(`
        SELECT DISTINCT t.*, COUNT(*) as frequency
        FROM tags t
        INNER JOIN transaction_tags tt ON t.id = tt.tagId
        INNER JOIN transactions tr ON tt.transactionId = tr.id
        WHERE tr.categoryId = ?
        GROUP BY t.id
        ORDER BY frequency DESC, t.usageCount DESC
        LIMIT 5
      `, [transactionData.categoryId]);

      // Get tags from similar transactions (same description keywords)
      const keywords = transactionData.description.toLowerCase().split(' ').filter(word => word.length > 3);
      let similarTags: any[] = [];

      if (keywords.length > 0) {
        const keywordConditions = keywords.map(() => 'LOWER(tr.description) LIKE ?').join(' OR ');
        const keywordParams = keywords.map(keyword => `%${keyword}%`);

        similarTags = await this.dbService.query(`
          SELECT DISTINCT t.*, COUNT(*) as frequency
          FROM tags t
          INNER JOIN transaction_tags tt ON t.id = tt.tagId
          INNER JOIN transactions tr ON tt.transactionId = tr.id
          WHERE (${keywordConditions})
          GROUP BY t.id
          ORDER BY frequency DESC
          LIMIT 3
        `, keywordParams);
      }

      // Combine and deduplicate suggestions
      const allSuggestions = [...categoryTags, ...similarTags];
      const uniqueSuggestions = allSuggestions.filter((tag, index, self) => 
        index === self.findIndex(t => t.id === tag.id)
      );

      return uniqueSuggestions.slice(0, 8).map(tag => ({
        ...tag,
        isSystem: Boolean(tag.isSystem),
      }));
    } catch (error) {
      logger.error('Failed to get suggested tags', { error });
      return [];
    }
  }

  /**
   * Delete custom tag (Premium only)
   */
  async deleteCustomTag(tagId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Custom tags are a premium feature' };
      }

      // Check if tag exists and is not a system tag
      const tag = await this.dbService.queryOne(
        'SELECT * FROM tags WHERE id = ? AND isSystem = 0',
        [tagId]
      );

      if (!tag) {
        return { success: false, error: 'Custom tag not found' };
      }

      // Remove tag from all transactions
      await this.dbService.query(
        'DELETE FROM transaction_tags WHERE tagId = ?',
        [tagId]
      );

      // Delete tag
      await this.dbService.query(
        'DELETE FROM tags WHERE id = ?',
        [tagId]
      );

      // Track analytics
      await this.analyticsService.track('custom_tag_deleted', {
        tagId,
        tagName: tag.name,
        usageCount: tag.usageCount,
      });

      logger.info('Custom tag deleted', { tagId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete custom tag', { tagId, error });
      return { success: false, error: 'Failed to delete tag' };
    }
  }
}