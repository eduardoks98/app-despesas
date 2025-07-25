import mysql from 'mysql2/promise';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');

  try {
    // Clean up test database
    const connection = await mysql.createConnection({
      host: process.env.TEST_DB_HOST || 'localhost',
      user: process.env.TEST_DB_USER || 'root',
      password: process.env.TEST_DB_PASSWORD || '',
      port: parseInt(process.env.TEST_DB_PORT || '3306'),
    });

    const testDbName = process.env.TEST_DB_NAME || 'app_despesas_test';
    
    // Optionally drop test database (be careful!)
    if (process.env.DROP_TEST_DB === 'true') {
      await connection.execute(`DROP DATABASE IF EXISTS \`${testDbName}\``);
      console.log(`🗑️ Test database '${testDbName}' dropped`);
    } else {
      // Just clean tables
      await connection.execute(`USE \`${testDbName}\``);
      
      // Get all tables
      const [tables] = await connection.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ?
      `, [testDbName]);

      // Disable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

      // Truncate all tables
      for (const table of tables as any[]) {
        await connection.execute(`TRUNCATE TABLE \`${table.table_name}\``);
      }

      // Re-enable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ Test database tables cleaned');
    }

    await connection.end();

  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error to avoid failing the test suite
  }

  console.log('✅ Test environment cleanup completed');
}