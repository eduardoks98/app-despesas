import fs from 'fs';
import path from 'path';
import { Database } from '../config/database';
import { logger } from '../utils/logger';

export class DatabaseSeeder {
  private static db = Database.getInstance();

  static async runSeeds(): Promise<void> {
    try {
      logger.info('Starting database seeding...');

      // Create seeds table if it doesn't exist
      await this.createSeedsTable();

      // Get all seed files
      const seedsDir = path.join(__dirname, 'seeds');
      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of seedFiles) {
        await this.runSeed(file);
      }

      logger.info('All seeds completed successfully');
    } catch (error) {
      logger.error('Seeding failed:', error);
      throw error;
    }
  }

  private static async createSeedsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS seeds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(191) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.db.query(query);
    logger.info('Seeds table ready');
  }

  private static async runSeed(filename: string): Promise<void> {
    // Check if seed already ran
    const rows = await this.db.query(
      'SELECT id FROM seeds WHERE filename = ?',
      [filename]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      logger.info(`Seed ${filename} already executed, skipping`);
      return;
    }

    // Read seed file
    const seedPath = path.join(__dirname, 'seeds', filename);
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    // Execute seed in transaction
    try {
      await this.db.transaction(async (connection) => {
        // Split by semicolons and filter out empty statements
        const statements = seedSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement);
          }
        }
      });
      
      // Record seed as executed
      await this.db.query(
        'INSERT INTO seeds (filename) VALUES (?)',
        [filename]
      );

      logger.info(`Seed ${filename} executed successfully`);
    } catch (error) {
      logger.error(`Seed ${filename} failed:`, error);
      throw error;
    }
  }

  static async getSeedStatus(): Promise<Array<{ filename: string; executed_at: Date }>> {
    const rows = await this.db.query(
      'SELECT filename, executed_at FROM seeds ORDER BY executed_at DESC'
    );

    return rows as Array<{ filename: string; executed_at: Date }>;
  }

  static async resetSeeds(): Promise<void> {
    try {
      logger.warn('Clearing all seed records...');
      await this.db.query('DELETE FROM seeds');
      logger.info('Seed records cleared');
    } catch (error) {
      logger.error('Failed to reset seeds:', error);
      throw error;
    }
  }
}