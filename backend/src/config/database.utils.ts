import { DataSource, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export class DatabaseUtils {
  private static logger = new Logger('DatabaseUtils');

  /**
   * Create a database connection with retry logic
   */
  static async createConnection(
    configService: ConfigService,
    retries: number = 3,
    delay: number = 5000
  ): Promise<DataSource> {
    const dataSource = new DataSource({
      type: 'postgres',
      host: configService.get('DB_HOST', 'localhost'),
      port: parseInt(configService.get('DB_PORT', '5432')),
      username: configService.get('DB_USERNAME', 'postgres'),
      password: configService.get('DB_PASSWORD', 'password'),
      database: configService.get('DB_NAME', 'mentoring_platform'),
      ssl: configService.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      connectTimeoutMS: 60000,
      extra: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 60000,
      },
    });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.log(`Database connection attempt ${attempt}/${retries}`);
        await dataSource.initialize();
        this.logger.log('✅ Database connection established successfully');
        return dataSource;
      } catch (error) {
        this.logger.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw new Error(`Failed to connect to database after ${retries} attempts: ${error.message}`);
        }
        
        this.logger.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw new Error('Unexpected error in database connection');
  }

  /**
   * Test database connection
   */
  static async testConnection(dataSource: DataSource): Promise<boolean> {
    try {
      await dataSource.query('SELECT 1');
      this.logger.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      this.logger.error('❌ Database connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Check if database exists
   */
  static async databaseExists(
    configService: ConfigService,
    databaseName: string
  ): Promise<boolean> {
    const tempDataSource = new DataSource({
      type: 'postgres',
      host: configService.get('DB_HOST', 'localhost'),
      port: parseInt(configService.get('DB_PORT', '5432')),
      username: configService.get('DB_USERNAME', 'postgres'),
      password: configService.get('DB_PASSWORD', 'password'),
      database: 'postgres', // Connect to default postgres database
      ssl: configService.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
    });

    try {
      await tempDataSource.initialize();
      const result = await tempDataSource.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [databaseName]
      );
      await tempDataSource.destroy();
      return result.length > 0;
    } catch (error) {
      this.logger.error('Error checking database existence:', error.message);
      await tempDataSource.destroy();
      return false;
    }
  }

  /**
   * Create database if it doesn't exist
   */
  static async createDatabaseIfNotExists(
    configService: ConfigService,
    databaseName: string
  ): Promise<void> {
    const exists = await this.databaseExists(configService, databaseName);
    
    if (!exists) {
      this.logger.log(`Creating database: ${databaseName}`);
      
      const tempDataSource = new DataSource({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432')),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: 'postgres',
        ssl: configService.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
      });

      try {
        await tempDataSource.initialize();
        await tempDataSource.query(`CREATE DATABASE "${databaseName}"`);
        await tempDataSource.destroy();
        this.logger.log(`✅ Database ${databaseName} created successfully`);
      } catch (error) {
        await tempDataSource.destroy();
        throw new Error(`Failed to create database ${databaseName}: ${error.message}`);
      }
    } else {
      this.logger.log(`Database ${databaseName} already exists`);
    }
  }

  /**
   * Run migrations safely with transaction
   */
  static async runMigrations(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    
    try {
      this.logger.log('🔄 Running database migrations...');
      await dataSource.runMigrations();
      this.logger.log('✅ Database migrations completed successfully');
    } catch (error) {
      this.logger.error('❌ Migration failed:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Check migration status
   */
  static async getMigrationStatus(dataSource: DataSource): Promise<any[]> {
    try {
      const executedMigrations = await dataSource.query(
        'SELECT * FROM migrations ORDER BY timestamp DESC'
      );
      return executedMigrations;
    } catch (error) {
      this.logger.warn('Could not retrieve migration status:', error.message);
      return [];
    }
  }

  /**
   * Backup database (PostgreSQL specific)
   */
  static async createBackup(
    configService: ConfigService,
    backupPath: string
  ): Promise<void> {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    const host = configService.get('DB_HOST', 'localhost');
    const port = configService.get('DB_PORT', '5432');
    const username = configService.get('DB_USERNAME', 'postgres');
    const database = configService.get('DB_NAME', 'mentoring_platform');

    const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f ${backupPath}`;

    try {
      this.logger.log(`Creating database backup: ${backupPath}`);
      await execAsync(command);
      this.logger.log('✅ Database backup created successfully');
    } catch (error) {
      this.logger.error('❌ Database backup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(dataSource: DataSource): Promise<any> {
    try {
      const stats = await dataSource.query(`
        SELECT 
          schemaname,
          relname as tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `);

      const dbSize = await dataSource.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `);

      return {
        tables: stats,
        databaseSize: dbSize[0]?.database_size || 'Unknown',
      };
    } catch (error) {
      this.logger.error('Error getting database statistics:', error.message);
      return {
        tables: [],
        databaseSize: 'Unknown',
      };
    }
  }

  /**
   * Optimize database performance
   */
  static async optimizeDatabase(dataSource: DataSource): Promise<void> {
    try {
      this.logger.log('🔄 Optimizing database performance...');
      
      // Update table statistics
      await dataSource.query('ANALYZE');
      
      // Vacuum database
      await dataSource.query('VACUUM');
      
      this.logger.log('✅ Database optimization completed');
    } catch (error) {
      this.logger.error('❌ Database optimization failed:', error.message);
      throw error;
    }
  }

  /**
   * Sleep utility function
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute query with retry logic
   */
  static async executeWithRetry<T>(
    dataSource: DataSource,
    query: string,
    parameters?: any[],
    retries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await dataSource.query(query, parameters);
      } catch (error) {
        this.logger.error(`Query attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        await this.sleep(1000 * attempt); // Exponential backoff
      }
    }
    
    throw new Error('Unexpected error in query execution');
  }

  /**
   * Check table exists
   */
  static async tableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
    try {
      const result = await dataSource.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      return result[0]?.exists || false;
    } catch (error) {
      this.logger.error(`Error checking if table ${tableName} exists:`, error.message);
      return false;
    }
  }

  /**
   * Get table row count
   */
  static async getTableRowCount(dataSource: DataSource, tableName: string): Promise<number> {
    try {
      const result = await dataSource.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return parseInt(result[0]?.count || '0');
    } catch (error) {
      this.logger.error(`Error getting row count for table ${tableName}:`, error.message);
      return 0;
    }
  }
}