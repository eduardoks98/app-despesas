import fs from 'fs';
import path from 'path';
import { Database } from '../config/database';
import { logger } from '../utils/logger';

export class DatabaseMigrator {
  private static db = Database.getInstance();

  static async runMigrations(): Promise<void> {
    try {
      logger.info('Starting database migrations...');

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get all migration files
      const migrationsDir = path.join(__dirname, 'migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        await this.runMigration(file);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  private static async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.db.execute(query);
    logger.info('Migrations table ready');
  }

  private static async runMigration(filename: string): Promise<void> {
    // Check if migration already ran
    const [rows] = await this.db.execute(
      'SELECT id FROM migrations WHERE filename = ?',
      [filename]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      logger.info(`Migration ${filename} already executed, skipping`);
      return;
    }

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', filename);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    try {
      await this.db.execute(migrationSQL);
      
      // Record migration as executed
      await this.db.execute(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );

      logger.info(`Migration ${filename} executed successfully`);
    } catch (error) {
      logger.error(`Migration ${filename} failed:`, error);
      throw error;
    }
  }

  static async rollbackLastMigration(): Promise<void> {
    // This would implement rollback logic
    // For now, just log
    logger.warn('Rollback functionality not implemented yet');
  }

  static async getMigrationStatus(): Promise<Array<{ filename: string; executed_at: Date }>> {
    const [rows] = await this.db.execute(
      'SELECT filename, executed_at FROM migrations ORDER BY executed_at DESC'
    );

    return rows as Array<{ filename: string; executed_at: Date }>;
  }
}