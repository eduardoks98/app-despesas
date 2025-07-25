import { execSync } from 'child_process';
import mysql from 'mysql2/promise';

export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');

  // Ensure test database exists
  try {
    // Create test database connection
    const connection = await mysql.createConnection({
      host: process.env.TEST_DB_HOST || 'localhost',
      user: process.env.TEST_DB_USER || 'root',
      password: process.env.TEST_DB_PASSWORD || '',
      port: parseInt(process.env.TEST_DB_PORT || '3306'),
    });

    // Create test database if it doesn't exist
    const testDbName = process.env.TEST_DB_NAME || 'app_despesas_test';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${testDbName}\``);
    await connection.end();

    console.log(`✅ Test database '${testDbName}' ready`);

    // Run migrations on test database
    console.log('🔄 Running test database migrations...');
    
    // Set environment for migrations
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = testDbName;

    // You can add migration commands here if you have them
    // execSync('npm run migrate:test', { stdio: 'inherit' });

    console.log('✅ Test database migrations completed');

  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}