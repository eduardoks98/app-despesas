/**
 * Custom Categories Service - Premium feature for unlimited custom categories
 */

import { DatabaseService } from '../core/DatabaseService';
import { AuthenticationService } from '../core/AuthenticationService';
import { AnalyticsService } from '../core/AnalyticsService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isSystem: boolean;
  isCustom: boolean;
  parentId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTemplate {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  description: string;
  subcategories?: Array<{
    name: string;
    icon: string;
    color: string;
  }>;
}

export interface CategoryStats {
  totalCategories: number;
  customCategories: number;
  systemCategories: number;
  mostUsedCategories: Array<{
    categoryId: string;
    categoryName: string;
    transactionCount: number;
    totalAmount: number;
  }>;
  unusedCategories: string[];
}

const CATEGORY_TEMPLATES: CategoryTemplate[] = [
  {
    id: 'food_detailed',
    name: 'Alimentação Detalhada',
    icon: 'restaurant-outline',
    color: '#F59E0B',
    type: 'expense',
    description: 'Categorias detalhadas para gastos com alimentação',
    subcategories: [
      { name: 'Restaurantes', icon: 'restaurant-outline', color: '#F59E0B' },
      { name: 'Delivery', icon: 'bicycle-outline', color: '#EF4444' },
      { name: 'Supermercado', icon: 'storefront-outline', color: '#10B981' },
      { name: 'Padaria', icon: 'cafe-outline', color: '#8B5CF6' },
      { name: 'Lanchonete', icon: 'fast-food-outline', color: '#F97316' },
    ],
  },
  {
    id: 'freelance_income',
    name: 'Renda de Freelancer',
    icon: 'laptop-outline',
    color: '#10B981',
    type: 'income',
    description: 'Categorias para diferentes tipos de trabalho freelance',
    subcategories: [
      { name: 'Design Gráfico', icon: 'color-palette-outline', color: '#EC4899' },
      { name: 'Desenvolvimento', icon: 'code-slash-outline', color: '#3B82F6' },
      { name: 'Consultoria', icon: 'person-outline', color: '#10B981' },
      { name: 'Tradução', icon: 'language-outline', color: '#8B5CF6' },
      { name: 'Marketing Digital', icon: 'megaphone-outline', color: '#F59E0B' },
    ],
  },
  {
    id: 'health_wellness',
    name: 'Saúde e Bem-estar',
    icon: 'heart-outline',
    color: '#EF4444',
    type: 'expense',
    description: 'Categorias relacionadas à saúde e bem-estar',
    subcategories: [
      { name: 'Médico', icon: 'medical-outline', color: '#EF4444' },
      { name: 'Dentista', icon: 'happy-outline', color: '#3B82F6' },
      { name: 'Academia', icon: 'fitness-outline', color: '#10B981' },
      { name: 'Farmácia', icon: 'bandage-outline', color: '#F59E0B' },
      { name: 'Terapia', icon: 'person-circle-outline', color: '#8B5CF6' },
    ],
  },
  {
    id: 'education',
    name: 'Educação',
    icon: 'school-outline',
    color: '#3B82F6',
    type: 'expense',
    description: 'Categorias relacionadas à educação e desenvolvimento',
    subcategories: [
      { name: 'Cursos Online', icon: 'laptop-outline', color: '#3B82F6' },
      { name: 'Livros', icon: 'book-outline', color: '#8B5CF6' },
      { name: 'Workshops', icon: 'people-outline', color: '#10B981' },
      { name: 'Certificações', icon: 'ribbon-outline', color: '#F59E0B' },
      { name: 'Material Escolar', icon: 'pencil-outline', color: '#EC4899' },
    ],
  },
];

export class CustomCategoriesService {
  private static instance: CustomCategoriesService;
  private dbService: DatabaseService;
  private authService: AuthenticationService;
  private analyticsService: AnalyticsService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.authService = AuthenticationService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): CustomCategoriesService {
    if (!CustomCategoriesService.instance) {
      CustomCategoriesService.instance = new CustomCategoriesService();
    }
    return CustomCategoriesService.instance;
  }

  /**
   * Create a custom category (Premium only)
   */
  async createCustomCategory(category: Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; categoryId?: string; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Custom categories are a premium feature' };
      }

      // Check if category name already exists
      const existingCategory = await this.dbService.queryOne(
        'SELECT id FROM categories WHERE name = ? AND (isSystem = 1 OR isCustom = 1)',
        [category.name]
      );

      if (existingCategory) {
        return { success: false, error: 'Category name already exists' };
      }

      // Generate category ID
      const categoryId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // Get next sort order
      const maxSortOrder = await this.dbService.queryOne(
        'SELECT MAX(sortOrder) as maxOrder FROM categories'
      );
      const sortOrder = (maxSortOrder?.maxOrder || 0) + 1;

      // Insert category
      await this.dbService.query(
        `INSERT INTO categories (id, name, icon, color, type, isSystem, isCustom, parentId, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?)`,
        [
          categoryId,
          category.name,
          category.icon,
          category.color,
          category.type,
          category.parentId || null,
          sortOrder,
          now,
          now,
        ]
      );

      // Track analytics
      await this.analyticsService.track('custom_category_created', {
        categoryId,
        categoryName: category.name,
        categoryType: category.type,
        hasParent: !!category.parentId,
      });

      logger.info('Custom category created', { categoryId, name: category.name });

      return { success: true, categoryId };
    } catch (error) {
      logger.error('Failed to create custom category', { error });
      return { success: false, error: 'Failed to create category' };
    }
  }

  /**
   * Update custom category (Premium only)
   */
  async updateCustomCategory(categoryId: string, updates: Partial<CustomCategory>): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Custom categories are a premium feature' };
      }

      // Check if category exists and is custom
      const category = await this.dbService.queryOne(
        'SELECT * FROM categories WHERE id = ? AND isCustom = 1',
        [categoryId]
      );

      if (!category) {
        return { success: false, error: 'Custom category not found' };
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];

      if (updates.name) {
        // Check if new name already exists
        const existingCategory = await this.dbService.queryOne(
          'SELECT id FROM categories WHERE name = ? AND id != ?',
          [updates.name, categoryId]
        );

        if (existingCategory) {
          return { success: false, error: 'Category name already exists' };
        }

        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }

      if (updates.icon) {
        updateFields.push('icon = ?');
        updateValues.push(updates.icon);
      }

      if (updates.color) {
        updateFields.push('color = ?');
        updateValues.push(updates.color);
      }

      if (updates.type) {
        updateFields.push('type = ?');
        updateValues.push(updates.type);
      }

      if (updates.parentId !== undefined) {
        updateFields.push('parentId = ?');
        updateValues.push(updates.parentId);
      }

      if (updates.sortOrder !== undefined) {
        updateFields.push('sortOrder = ?');
        updateValues.push(updates.sortOrder);
      }

      updateFields.push('updatedAt = ?');
      updateValues.push(new Date().toISOString());

      // Add categoryId for WHERE clause
      updateValues.push(categoryId);

      await this.dbService.query(
        `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Track analytics
      await this.analyticsService.track('custom_category_updated', {
        categoryId,
        updatedFields: Object.keys(updates),
      });

      logger.info('Custom category updated', { categoryId, updates });

      return { success: true };
    } catch (error) {
      logger.error('Failed to update custom category', { categoryId, error });
      return { success: false, error: 'Failed to update category' };
    }
  }

  /**
   * Delete custom category (Premium only)
   */
  async deleteCustomCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Custom categories are a premium feature' };
      }

      // Check if category exists and is custom
      const category = await this.dbService.queryOne(
        'SELECT * FROM categories WHERE id = ? AND isCustom = 1',
        [categoryId]
      );

      if (!category) {
        return { success: false, error: 'Custom category not found' };
      }

      // Check if category is being used in transactions
      const transactionCount = await this.dbService.queryOne(
        'SELECT COUNT(*) as count FROM transactions WHERE categoryId = ?',
        [categoryId]
      );

      if (transactionCount && transactionCount.count > 0) {
        return { success: false, error: 'Cannot delete category that has transactions' };
      }

      // Delete subcategories first
      await this.dbService.query(
        'DELETE FROM categories WHERE parentId = ?',
        [categoryId]
      );

      // Delete category
      await this.dbService.query(
        'DELETE FROM categories WHERE id = ?',
        [categoryId]
      );

      // Track analytics
      await this.analyticsService.track('custom_category_deleted', {
        categoryId,
        categoryName: category.name,
      });

      logger.info('Custom category deleted', { categoryId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete custom category', { categoryId, error });
      return { success: false, error: 'Failed to delete category' };
    }
  }

  /**
   * Get all custom categories
   */
  async getCustomCategories(): Promise<CustomCategory[]> {
    try {
      const categories = await this.dbService.query(
        `SELECT * FROM categories 
         WHERE isCustom = 1 
         ORDER BY sortOrder ASC, name ASC`
      );

      return categories.map(cat => ({
        ...cat,
        isCustom: Boolean(cat.isCustom),
        isSystem: Boolean(cat.isSystem),
      }));
    } catch (error) {
      logger.error('Failed to get custom categories', { error });
      return [];
    }
  }

  /**
   * Get category templates for easy creation
   */
  getCategoryTemplates(): CategoryTemplate[] {
    return CATEGORY_TEMPLATES;
  }

  /**
   * Create categories from template (Premium only)
   */
  async createFromTemplate(templateId: string): Promise<{ success: boolean; categoriesCreated?: number; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Custom categories are a premium feature' };
      }

      const template = CATEGORY_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      let categoriesCreated = 0;
      const now = new Date().toISOString();

      // Create main category
      const mainCategoryResult = await this.createCustomCategory({
        name: template.name,
        icon: template.icon,
        color: template.color,
        type: template.type,
        isSystem: false,
        isCustom: true,
        sortOrder: 0,
      });

      if (mainCategoryResult.success) {
        categoriesCreated++;

        // Create subcategories if they exist
        if (template.subcategories && template.subcategories.length > 0) {
          for (const sub of template.subcategories) {
            const subCategoryResult = await this.createCustomCategory({
              name: sub.name,
              icon: sub.icon,
              color: sub.color,
              type: template.type,
              isSystem: false,
              isCustom: true,
              parentId: mainCategoryResult.categoryId,
              sortOrder: 0,
            });

            if (subCategoryResult.success) {
              categoriesCreated++;
            }
          }
        }
      }

      // Track analytics
      await this.analyticsService.track('category_template_applied', {
        templateId,
        templateName: template.name,
        categoriesCreated,
      });

      logger.info('Categories created from template', { templateId, categoriesCreated });

      return { success: true, categoriesCreated };
    } catch (error) {
      logger.error('Failed to create categories from template', { templateId, error });
      return { success: false, error: 'Failed to create categories from template' };
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<CategoryStats> {
    try {
      // Get total counts
      const totalCounts = await this.dbService.queryOne(`
        SELECT 
          COUNT(*) as totalCategories,
          SUM(CASE WHEN isCustom = 1 THEN 1 ELSE 0 END) as customCategories,
          SUM(CASE WHEN isSystem = 1 THEN 1 ELSE 0 END) as systemCategories
        FROM categories
      `);

      // Get most used categories
      const mostUsed = await this.dbService.query(`
        SELECT 
          c.id as categoryId,
          c.name as categoryName,
          COUNT(t.id) as transactionCount,
          SUM(t.amount) as totalAmount
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.categoryId
        GROUP BY c.id, c.name
        HAVING COUNT(t.id) > 0
        ORDER BY COUNT(t.id) DESC
        LIMIT 10
      `);

      // Get unused categories
      const unused = await this.dbService.query(`
        SELECT c.id
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.categoryId
        WHERE t.id IS NULL AND c.isCustom = 1
      `);

      return {
        totalCategories: totalCounts?.totalCategories || 0,
        customCategories: totalCounts?.customCategories || 0,
        systemCategories: totalCounts?.systemCategories || 0,
        mostUsedCategories: mostUsed || [],
        unusedCategories: unused.map(u => u.id) || [],
      };
    } catch (error) {
      logger.error('Failed to get category stats', { error });
      return {
        totalCategories: 0,
        customCategories: 0,
        systemCategories: 0,
        mostUsedCategories: [],
        unusedCategories: [],
      };
    }
  }

  /**
   * Reorder categories (Premium only)
   */
  async reorderCategories(categoryOrders: Array<{ categoryId: string; sortOrder: number }>): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Category reordering is a premium feature' };
      }

      // Start transaction
      await this.dbService.beginTransaction();

      try {
        for (const order of categoryOrders) {
          await this.dbService.query(
            'UPDATE categories SET sortOrder = ?, updatedAt = ? WHERE id = ?',
            [order.sortOrder, new Date().toISOString(), order.categoryId]
          );
        }

        await this.dbService.commitTransaction();

        // Track analytics
        await this.analyticsService.track('categories_reordered', {
          categoriesReordered: categoryOrders.length,
        });

        logger.info('Categories reordered', { count: categoryOrders.length });

        return { success: true };
      } catch (error) {
        await this.dbService.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      logger.error('Failed to reorder categories', { error });
      return { success: false, error: 'Failed to reorder categories' };
    }
  }

  /**
   * Duplicate category (Premium only)
   */
  async duplicateCategory(categoryId: string, newName: string): Promise<{ success: boolean; categoryId?: string; error?: string }> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Category duplication is a premium feature' };
      }

      // Get original category
      const originalCategory = await this.dbService.queryOne(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (!originalCategory) {
        return { success: false, error: 'Category not found' };
      }

      // Create duplicate
      const result = await this.createCustomCategory({
        name: newName,
        icon: originalCategory.icon,
        color: originalCategory.color,
        type: originalCategory.type,
        isSystem: false,
        isCustom: true,
        parentId: originalCategory.parentId,
        sortOrder: originalCategory.sortOrder + 1,
      });

      if (result.success) {
        // Track analytics
        await this.analyticsService.track('category_duplicated', {
          originalCategoryId: categoryId,
          newCategoryId: result.categoryId,
          newName,
        });

        logger.info('Category duplicated', { originalCategoryId: categoryId, newCategoryId: result.categoryId });
      }

      return result;
    } catch (error) {
      logger.error('Failed to duplicate category', { categoryId, error });
      return { success: false, error: 'Failed to duplicate category' };
    }
  }
}