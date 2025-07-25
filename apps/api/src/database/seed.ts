/**
 * Database Seeder
 * 
 * Populates database with initial data for development and testing
 */

import { Database } from '../config/database';
import { AuthService } from '../services/AuthService';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class DatabaseSeeder {
  private db: Database;
  private authService: AuthService;

  constructor() {
    this.db = Database.getInstance();
    this.authService = AuthService.getInstance();
  }

  /**
   * Run all seeders
   */
  async seed(): Promise<void> {
    if (env.NODE_ENV === 'production') {
      logger.warn('⚠️  Seeding skipped in production environment');
      return;
    }

    logger.info('🌱 Starting database seeding...');

    try {
      await this.seedSystemCategories();
      await this.seedTestUsers();
      await this.seedSampleData();
      
      logger.info('🎉 Database seeding completed successfully');
    } catch (error) {
      logger.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed system categories
   */
  private async seedSystemCategories(): Promise<void> {
    logger.info('📂 Seeding system categories...');

    const categories = [
      // Expense categories
      { id: 'sys_food', name: 'Alimentação', icon: 'restaurant', color: '#FF6B6B', type: 'expense' },
      { id: 'sys_transport', name: 'Transporte', icon: 'directions-car', color: '#4ECDC4', type: 'expense' },
      { id: 'sys_health', name: 'Saúde', icon: 'local-hospital', color: '#45B7D1', type: 'expense' },
      { id: 'sys_entertainment', name: 'Entretenimento', icon: 'movie', color: '#F7DC6F', type: 'expense' },
      { id: 'sys_shopping', name: 'Compras', icon: 'shopping-cart', color: '#BB8FCE', type: 'expense' },
      { id: 'sys_bills', name: 'Contas', icon: 'receipt', color: '#F1948A', type: 'expense' },
      { id: 'sys_education', name: 'Educação', icon: 'school', color: '#82E0AA', type: 'expense' },
      { id: 'sys_home', name: 'Casa', icon: 'home', color: '#85C1E9', type: 'expense' },
      { id: 'sys_pets', name: 'Pets', icon: 'pets', color: '#F8C471', type: 'expense' },
      { id: 'sys_gifts', name: 'Presentes', icon: 'card-giftcard', color: '#D7BDE2', type: 'expense' },
      { id: 'sys_taxes', name: 'Impostos', icon: 'account-balance', color: '#FADBD8', type: 'expense' },
      { id: 'sys_other_expense', name: 'Outros', icon: 'more-horiz', color: '#AEB6BF', type: 'expense' },
      
      // Income categories
      { id: 'sys_salary', name: 'Salário', icon: 'work', color: '#58D68D', type: 'income' },
      { id: 'sys_freelance', name: 'Freelance', icon: 'computer', color: '#5DADE2', type: 'income' },
      { id: 'sys_investment', name: 'Investimentos', icon: 'trending-up', color: '#F8C471', type: 'income' },
      { id: 'sys_bonus', name: 'Bonificação', icon: 'card-giftcard', color: '#D7BDE2', type: 'income' },
      { id: 'sys_rental', name: 'Aluguel', icon: 'home', color: '#A9DFBF', type: 'income' },
      { id: 'sys_sales', name: 'Vendas', icon: 'store', color: '#F9E79F', type: 'income' },
      { id: 'sys_refund', name: 'Reembolso', icon: 'replay', color: '#AED6F1', type: 'income' },
      { id: 'sys_other_income', name: 'Outras Receitas', icon: 'attach-money', color: '#A9DFBF', type: 'income' },
    ];

    for (const category of categories) {
      await this.db.query(
        `INSERT IGNORE INTO categories (id, user_id, name, icon, color, is_system, createdAt, updatedAt)
         VALUES (?, 'SYSTEM', ?, ?, ?, TRUE, NOW(), NOW())`,
        [category.id, category.name, category.icon, category.color]
      );
    }

    logger.info(`✅ Seeded ${categories.length} system categories`);
  }

  /**
   * Seed test users
   */
  private async seedTestUsers(): Promise<void> {
    if (env.NODE_ENV !== 'development') {
      return;
    }

    logger.info('👥 Seeding test users...');

    const testUsers = [
      {
        email: 'admin@appdespesas.com',
        password: 'admin123',
        name: 'Administrador',
        isPremium: true,
        subscriptionStatus: 'active',
      },
      {
        email: 'user@test.com',
        password: 'user123',
        name: 'Usuário Teste',
        isPremium: false,
        subscriptionStatus: null,
      },
      {
        email: 'premium@test.com',
        password: 'premium123',
        name: 'Usuário Premium',
        isPremium: true,
        subscriptionStatus: 'active',
      },
    ];

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existing = await this.db.queryOne(
          'SELECT id FROM users WHERE email = ?',
          [userData.email]
        );

        if (existing) {
          logger.debug(`User ${userData.email} already exists, skipping`);
          continue;
        }

        // Create user through AuthService
        const { user } = await this.authService.register(
          userData.email,
          userData.password,
          userData.name
        );

        // Update premium status if needed
        if (userData.isPremium) {
          await this.db.query(
            `UPDATE users 
             SET isPremium = ?, subscriptionStatus = ?, subscriptionExpiresAt = DATE_ADD(NOW(), INTERVAL 1 YEAR)
             WHERE id = ?`,
            [userData.isPremium, userData.subscriptionStatus, user.id]
          );
        }

        // Create default categories for user
        await this.createUserCategories(user.id);

        logger.info(`✅ Created test user: ${userData.email}`);
      } catch (error) {
        logger.error(`❌ Failed to create test user ${userData.email}:`, error);
      }
    }
  }

  /**
   * Create default categories for a user
   */
  private async createUserCategories(userId: string): Promise<void> {
    const systemCategories = await this.db.query(
      'SELECT id, name, icon, color FROM categories WHERE user_id = "SYSTEM"'
    );

    for (const sysCategory of systemCategories) {
      const userCategoryId = `${userId}_${sysCategory.id}`;
      
      await this.db.query(
        `INSERT IGNORE INTO categories (id, user_id, name, icon, color, is_system, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [userCategoryId, userId, sysCategory.name, sysCategory.icon, sysCategory.color]
      );
    }
  }

  /**
   * Seed sample data for development
   */
  private async seedSampleData(): Promise<void> {
    if (env.NODE_ENV !== 'development') {
      return;
    }

    logger.info('📊 Seeding sample data...');

    // Get premium test user
    const testUser = await this.db.queryOne(
      'SELECT id FROM users WHERE email = ? AND isPremium = TRUE',
      ['premium@test.com']
    );

    if (!testUser) {
      logger.warn('No premium test user found, skipping sample data');
      return;
    }

    await this.seedSampleTransactions(testUser.id);
    await this.seedSampleSubscriptions(testUser.id);
    await this.seedSampleBudgets(testUser.id);
  }

  /**
   * Seed sample transactions
   */
  private async seedSampleTransactions(userId: string): Promise<void> {
    // Get user categories
    const categories = await this.db.query(
      'SELECT id, name FROM categories WHERE user_id = ? LIMIT 10',
      [userId]
    );

    if (categories.length === 0) {
      return;
    }

    const transactions = [
      // Income
      { amount: 5000.00, description: 'Salário Janeiro', type: 'income', days: -30 },
      { amount: 1200.00, description: 'Freelance - Website', type: 'income', days: -15 },
      { amount: 300.00, description: 'Dividendos', type: 'income', days: -10 },
      
      // Expenses
      { amount: -1200.00, description: 'Aluguel', type: 'expense', days: -28 },
      { amount: -450.00, description: 'Supermercado', type: 'expense', days: -25 },
      { amount: -150.00, description: 'Combustível', type: 'expense', days: -20 },
      { amount: -80.00, description: 'Cinema', type: 'expense', days: -18 },
      { amount: -200.00, description: 'Farmácia', type: 'expense', days: -15 },
      { amount: -60.00, description: 'Netflix', type: 'expense', days: -12 },
      { amount: -120.00, description: 'Jantar', type: 'expense', days: -8 },
      { amount: -300.00, description: 'Roupas', type: 'expense', days: -5 },
      { amount: -75.00, description: 'Uber', type: 'expense', days: -3 },
      { amount: -40.00, description: 'Café', type: 'expense', days: -1 },
    ];

    for (const transaction of transactions) {
      const categoryId = categories[Math.floor(Math.random() * categories.length)].id;
      const transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() + transaction.days);

      await this.db.query(
        `INSERT INTO transactions (id, user_id, amount, description, date, type, category_id, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          Math.abs(transaction.amount),
          transaction.description,
          transactionDate.toISOString().slice(0, 19).replace('T', ' '),
          transaction.type,
          categoryId
        ]
      );
    }

    logger.info(`✅ Seeded ${transactions.length} sample transactions`);
  }

  /**
   * Seed sample subscriptions
   */
  private async seedSampleSubscriptions(userId: string): Promise<void> {
    const categories = await this.db.query(
      'SELECT id FROM categories WHERE user_id = ? LIMIT 5',
      [userId]
    );

    if (categories.length === 0) {
      return;
    }

    const subscriptions = [
      { name: 'Netflix', amount: 45.90, cycle: 'monthly', day: 15 },
      { name: 'Spotify', amount: 21.90, cycle: 'monthly', day: 10 },
      { name: 'Academia', amount: 89.90, cycle: 'monthly', day: 5 },
      { name: 'Seguro Saúde', amount: 450.00, cycle: 'monthly', day: 1 },
    ];

    for (const sub of subscriptions) {
      const categoryId = categories[Math.floor(Math.random() * categories.length)].id;
      
      await this.db.query(
        `INSERT INTO subscriptions (id, user_id, name, amount, billing_cycle, due_day, category_id, start_date, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [userId, sub.name, sub.amount, sub.cycle, sub.day, categoryId]
      );
    }

    logger.info(`✅ Seeded ${subscriptions.length} sample subscriptions`);
  }

  /**
   * Seed sample budgets
   */
  private async seedSampleBudgets(userId: string): Promise<void> {
    const budgets = [
      { name: 'Alimentação', amount: 800.00, period: 'monthly' },
      { name: 'Transporte', amount: 300.00, period: 'monthly' },
      { name: 'Entretenimento', amount: 200.00, period: 'monthly' },
    ];

    for (const budget of budgets) {
      const startDate = new Date();
      startDate.setDate(1); // First day of month
      
      await this.db.query(
        `INSERT INTO budgets (id, userId, name, amount, period, startDate, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, budget.name, budget.amount, budget.period, startDate.toISOString().slice(0, 10)]
      );
    }

    logger.info(`✅ Seeded ${budgets.length} sample budgets`);
  }

  /**
   * Clean all data (for testing)
   */
  async clean(): Promise<void> {
    if (env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    logger.warn('🧹 Cleaning database...');

    const tables = [
      'refresh_tokens',
      'email_verifications', 
      'password_resets',
      'notifications',
      'budgets',
      'transactions',
      'subscriptions',
      'installments',
      'shared_account_members',
      'shared_accounts',
      'usage_analytics',
      'payment_logs',
      'sync_logs',
      'categories',
      'users'
    ];

    for (const table of tables) {
      await this.db.query(`DELETE FROM ${table} WHERE 1=1`);
    }

    logger.info('✅ Database cleaned');
  }
}

// CLI function to run seeder
export async function runSeeder() {
  try {
    const seeder = new DatabaseSeeder();
    await seeder.seed();
    logger.info('✅ Seeding completed');
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder if called directly
if (require.main === module) {
  runSeeder().then(() => {
    process.exit(0);
  });
}