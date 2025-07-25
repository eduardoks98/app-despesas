#!/usr/bin/env node

import { DatabaseMigrator } from '../database/migrate';
import { logger } from '../utils/logger';

async function main() {
  try {
    const command = process.argv[2];

    switch (command) {
      case 'up':
        logger.info('Running migrations...');
        await DatabaseMigrator.runMigrations();
        logger.info('✅ Migrations completed successfully!');
        break;

      case 'status':
        logger.info('Checking migration status...');
        const status = await DatabaseMigrator.getMigrationStatus();
        console.table(status);
        break;

      case 'rollback':
        logger.info('Rolling back last migration...');
        await DatabaseMigrator.rollbackLastMigration();
        break;

      default:
        console.log(`
🗄️  Database Migration Tool

Usage:
  npm run migrate up      - Run all pending migrations
  npm run migrate status  - Show migration status
  npm run migrate rollback - Rollback last migration

Examples:
  npm run migrate up
  npm run migrate status
        `);
        break;
    }
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  }
}

main();