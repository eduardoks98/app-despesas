import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';
import { env } from './env';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  ssl?: boolean;
}

export interface PoolStatus {
  total: number;
  active: number;
  idle: number;
  waiting: number;
}

export class Database {
  private static instance: Database;
  private pool: mysql.Pool;
  private isHealthy: boolean = false;

  private constructor() {
    const config: DatabaseConfig = {
      host: env.DB_HOST,
      port: parseInt(env.DB_PORT),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: parseInt(env.DB_CONNECTION_LIMIT),
      ssl: env.DB_SSL === 'true',
    };

    const poolConfig: mysql.PoolOptions = {
      ...config,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: 'utf8mb4',
      timezone: '+00:00',
      decimalNumbers: true,
      dateStrings: false,
      supportBigNumbers: true,
      bigNumberStrings: false,
      multipleStatements: true,
      connectAttributes: {
        program_name: 'app-despesas-api'
      }
    };

    // Add SSL config for production
    if (config.ssl && env.NODE_ENV === 'production') {
      poolConfig.ssl = {
        rejectUnauthorized: true
      };
    }

    this.pool = mysql.createPool(poolConfig);
    
    // Test connection on startup
    this.testConnection();
    
    // Setup connection monitoring
    this.setupMonitoring();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): mysql.Pool {
    return this.pool;
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows as T[];
    } finally {
      connection.release();
    }
  }

  public async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  public async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  private async testConnection(): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      this.isHealthy = true;
      logger.info('✅ Database connection established successfully');
    } catch (error) {
      this.isHealthy = false;
      logger.error('❌ Database connection failed:', error);
      // Don't throw here, let the app continue to startup
    }
  }

  private setupMonitoring(): void {
    // Monitor pool status every 30 seconds
    setInterval(() => {
      const status = this.getPoolStatus();
      if (status.waiting > 5) {
        logger.warn(`⚠️ Database pool has ${status.waiting} waiting connections`);
      }
    }, 30000);

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Database pool error:', err);
      this.isHealthy = false;
    });

    // Handle pool connection
    this.pool.on('connection', (connection) => {
      logger.debug('New database connection established');
      
      // Set session variables for each connection
      connection.query("SET time_zone='+00:00'");
      connection.query('SET NAMES utf8mb4');
    });
  }

  public getPoolStatus(): PoolStatus {
    const pool = this.pool as any; // Access private properties
    return {
      total: parseInt(env.DB_CONNECTION_LIMIT) || 10,
      active: pool._allConnections?.length || 0,
      idle: pool._freeConnections?.length || 0,
      waiting: pool._connectionQueue?.length || 0
    };
  }

  public isConnected(): boolean {
    return this.isHealthy;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const [result] = await this.pool.query('SELECT 1 as health');
      this.isHealthy = true;
      return true;
    } catch (error) {
      this.isHealthy = false;
      return false;
    }
  }

  // Helper method for parameterized queries with named parameters
  public async namedQuery<T = any>(
    sql: string, 
    params: Record<string, any>
  ): Promise<T[]> {
    // Convert named parameters to positional
    const keys = Object.keys(params);
    let processedSql = sql;
    const values: any[] = [];

    keys.forEach(key => {
      const regex = new RegExp(`:${key}\\b`, 'g');
      processedSql = processedSql.replace(regex, '?');
      values.push(params[key]);
    });

    return this.query<T>(processedSql, values);
  }

  // Bulk insert helper
  public async bulkInsert(
    table: string,
    columns: string[],
    values: any[][]
  ): Promise<mysql.ResultSetHeader> {
    if (values.length === 0) return { affectedRows: 0 } as mysql.ResultSetHeader;

    const placeholders = values.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
    const flatValues = values.flat();

    const [result] = await this.pool.execute(sql, flatValues);
    return result as mysql.ResultSetHeader;
  }

  // Upsert helper
  public async upsert(
    table: string,
    data: Record<string, any>,
    uniqueKeys: string[]
  ): Promise<mysql.ResultSetHeader> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const updateClauses = columns
      .filter(col => !uniqueKeys.includes(col))
      .map(col => `${col} = VALUES(${col})`)
      .join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${columns.map(() => '?').join(', ')})
      ON DUPLICATE KEY UPDATE ${updateClauses}
    `;

    const [result] = await this.pool.execute(sql, values);
    return result as mysql.ResultSetHeader;
  }
}