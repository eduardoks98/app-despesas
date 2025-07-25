#!/usr/bin/env node

import { DatabaseSeeder } from '../database/seed';
import { logger } from '../utils/logger';

async function main() {
  try {
    const command = process.argv[2];

    switch (command) {
      case 'run':
        logger.info('Running seeds...');
        await DatabaseSeeder.runSeeds();
        logger.info('✅ Seeds completed successfully!');
        break;

      case 'status':
        logger.info('Checking seed status...');
        const status = await DatabaseSeeder.getSeedStatus();
        console.table(status);
        break;

      case 'reset':
        logger.info('Resetting seeds...');
        await DatabaseSeeder.resetSeeds();
        logger.info('✅ Seeds reset successfully!');
        break;

      default:
        console.log(`
🌱 Database Seeder Tool

Usage:
  npm run seed run     - Run all seeds
  npm run seed status  - Show seed status
  npm run seed reset   - Reset seed records (allows re-running)

Examples:
  npm run seed run
  npm run seed status
        `);
        break;
    }
  } catch (error) {
    logger.error('Seed script failed:', error);
    process.exit(1);
  }
}

main();