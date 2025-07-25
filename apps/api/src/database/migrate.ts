/**
 * Database Migration System
 * 
 * Manages database schema creation and updates
 */

import fs from 'fs';
import path from 'path';
import { Database } from '../config/database';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface Migration {
  id: string;
  name: string;
  filename: string;
  sql: string;
  checksum: string;
  appliedAt?: Date;
}

export class MigrationManager {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Initialize migration system
   */
  async initialize(): Promise<void> {
    await this.createMigrationsTable();
  }

  /**
   * Create migrations tracking table
   */
  private async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL UNIQUE,
        checksum VARCHAR(64) NOT NULL,
        appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_filename (filename),
        INDEX idx_appliedAt (appliedAt)
      );
    `;

    await this.db.query(sql);
    logger.info('✅ Migrations table initialized');
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    logger.info('🔄 Starting database migrations...');

    // First, run the main schema
    await this.runMainSchema();

    // Then run additional migrations
    const migrations = await this.loadMigrations();
    const appliedMigrations = await this.getAppliedMigrations();
    
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.find(applied => applied.filename === migration.filename)
    );

    if (pendingMigrations.length === 0) {
      logger.info('✅ No pending migrations');
      return;
    }

    logger.info(`📝 Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      try {
        await this.runMigration(migration);
        logger.info(`✅ Applied migration: ${migration.name}`);
      } catch (error) {
        logger.error(`❌ Failed to apply migration ${migration.name}:`, error);
        throw error;
      }
    }

    logger.info(`🎉 Successfully applied ${pendingMigrations.length} migrations`);
  }

  /**
   * Run the main schema file
   */
  private async runMainSchema(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found');
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const checksum = this.calculateChecksum(schemaSql);
    
    // Check if schema was already applied
    const existing = await this.db.queryOne<Migration>(
      'SELECT * FROM migrations WHERE filename = ?',
      ['schema.sql']
    );

    if (existing) {
      if (existing.checksum !== checksum) {
        logger.warn('⚠️  Schema file has changed since last migration');
        // In production, you might want to handle this differently
      } else {
        logger.info('✅ Schema already applied');
        return;
      }
    }

    // Execute schema SQL
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('insert')) {
        // Handle INSERT IGNORE statements specially
        try {
          await this.db.query(statement);
        } catch (error: any) {
          // Ignore duplicate entry errors for INSERT IGNORE
          if (!error.message.includes('Duplicate entry')) {
            throw error;
          }
        }
      } else {
        await this.db.query(statement);
      }
    }

    // Record schema migration
    if (!existing) {
      await this.recordMigration({
        id: this.generateId(),
        name: 'Initial Schema',
        filename: 'schema.sql',
        sql: schemaSql,
        checksum,
      });
    } else {
      // Update checksum
      await this.db.query(
        'UPDATE migrations SET checksum = ? WHERE filename = ?',
        [checksum, 'schema.sql']
      );
    }

    logger.info('✅ Main schema applied');
  }

  /**
   * Load migration files from disk
   */
  private async loadMigrations(): Promise<Migration[]> {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const checksum = this.calculateChecksum(sql);
      
      // Extract migration name from filename
      const nameMatch = file.match(/^\d+_(.+)\.sql$/);
      const name = nameMatch ? nameMatch[1].replace(/_/g, ' ') : file;

      migrations.push({
        id: this.generateId(),
        name,
        filename: file,
        sql,
        checksum,
      });
    }

    return migrations;
  }

  /**
   * Get applied migrations from database
   */
  private async getAppliedMigrations(): Promise<Migration[]> {
    return this.db.query<Migration>(
      'SELECT * FROM migrations ORDER BY appliedAt ASC'
    );
  }

  /**
   * Run a single migration
   */
  private async runMigration(migration: Migration): Promise<void> {
    await this.db.transaction(async (connection) => {
      // Execute migration SQL
      const statements = migration.sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        await connection.execute(statement);
      }

      // Record migration
      await connection.execute(
        `INSERT INTO migrations (id, name, filename, checksum, appliedAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [migration.id, migration.name, migration.filename, migration.checksum]
      );
    });
  }

  /**
   * Record migration in database
   */
  private async recordMigration(migration: Migration): Promise<void> {
    await this.db.query(
      `INSERT INTO migrations (id, name, filename, checksum, appliedAt)
       VALUES (?, ?, ?, ?, NOW())`,
      [migration.id, migration.name, migration.filename, migration.checksum]
    );
  }

  /**
   * Calculate checksum for SQL content
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * Create a new migration file
   */
  async createMigration(name: string, sql: string): Promise<string> {
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filepath = path.join(migrationsDir, filename);

    const migrationContent = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

${sql}

-- End of migration`;

    fs.writeFileSync(filepath, migrationContent);
    logger.info(`📝 Created migration: ${filename}`);
    
    return filename;
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    applied: Migration[];
    pending: string[];
    total: number;
  }> {
    const applied = await this.getAppliedMigrations();
    const all = await this.loadMigrations();
    
    const appliedFilenames = applied.map(m => m.filename);
    const pending = all
      .filter(m => !appliedFilenames.includes(m.filename))
      .map(m => m.filename);

    return {
      applied,
      pending,
      total: all.length,
    };
  }
}

// CLI function to run migrations
export async function runMigrations() {
  try {
    const manager = new MigrationManager();
    await manager.initialize();
    await manager.runMigrations();
    
    const status = await manager.getStatus();
    logger.info(`📊 Migration Status: ${status.applied.length} applied, ${status.pending.length} pending`);
    
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations().then(() => {
    logger.info('✅ Migration completed');
    process.exit(0);
  });
}