import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

const execAsync = promisify(exec);

interface BackupConfig {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
  backupDir: string;
  encryptionKey: string;
  retentionDays: number;
}

class DatabaseBackupService {
  private config: BackupConfig;

  constructor() {
    this.config = {
      dbHost: process.env.DB_HOST || 'localhost',
      dbPort: parseInt(process.env.DB_PORT || '5432'),
      dbName: process.env.DB_NAME || 'mentoring_platform',
      dbUsername: process.env.DB_USERNAME || 'postgres',
      dbPassword: process.env.DB_PASSWORD || '',
      backupDir: process.env.BACKUP_DIR || './backups',
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || 'default-key-change-in-production',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    };
  }

  /**
   * Create a full database backup
   */
  async createBackup(): Promise<string> {
    try {
      console.log('Starting database backup...');
      
      // Ensure backup directory exists
      await this.ensureBackupDirectory();
      
      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `backup_${this.config.dbName}_${timestamp}.sql`;
      const backupPath = path.join(this.config.backupDir, backupFilename);
      
      // Create pg_dump command
      const dumpCommand = this.buildDumpCommand(backupPath);
      
      // Execute backup
      console.log('Executing pg_dump...');
      await execAsync(dumpCommand);
      
      // Verify backup file exists and has content
      const stats = await fs.promises.stat(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }
      
      console.log(`Backup created: ${backupPath} (${this.formatBytes(stats.size)})`);
      
      // Encrypt backup file
      const encryptedPath = await this.encryptBackup(backupPath);
      
      // Remove unencrypted backup
      await fs.promises.unlink(backupPath);
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      console.log(`Encrypted backup completed: ${encryptedPath}`);
      return encryptedPath;
      
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      console.log(`Starting database restore from: ${backupPath}`);
      
      // Decrypt backup file
      const decryptedPath = await this.decryptBackup(backupPath);
      
      // Verify backup file
      const stats = await fs.promises.stat(decryptedPath);
      if (stats.size === 0) {
        throw new Error('Decrypted backup file is empty');
      }
      
      // Create restore command
      const restoreCommand = this.buildRestoreCommand(decryptedPath);
      
      // Execute restore
      console.log('Executing psql restore...');
      await execAsync(restoreCommand);
      
      // Clean up decrypted file
      await fs.promises.unlink(decryptedPath);
      
      console.log('Database restore completed successfully');
      
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<Array<{ filename: string; size: number; date: Date }>> {
    try {
      const files = await fs.promises.readdir(this.config.backupDir);
      const backups = [];
      
      for (const file of files) {
        if (file.endsWith('.sql.enc')) {
          const filePath = path.join(this.config.backupDir, file);
          const stats = await fs.promises.stat(filePath);
          
          backups.push({
            filename: file,
            size: stats.size,
            date: stats.mtime,
          });
        }
      }
      
      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
      
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      // Decrypt backup temporarily
      const decryptedPath = await this.decryptBackup(backupPath);
      
      // Check if file can be read and contains SQL content
      const content = await fs.promises.readFile(decryptedPath, 'utf8');
      const isValidSql = content.includes('PostgreSQL database dump') || 
                        content.includes('CREATE TABLE') ||
                        content.includes('INSERT INTO');
      
      // Clean up
      await fs.promises.unlink(decryptedPath);
      
      return isValidSql;
      
    } catch (error) {
      console.error('Backup verification failed:', error);
      return false;
    }
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.promises.access(this.config.backupDir);
    } catch {
      await fs.promises.mkdir(this.config.backupDir, { recursive: true });
    }
  }

  private buildDumpCommand(outputPath: string): string {
    const pgDumpPath = process.env.PG_DUMP_PATH || 'pg_dump';
    
    return `PGPASSWORD="${this.config.dbPassword}" ${pgDumpPath} ` +
           `-h ${this.config.dbHost} ` +
           `-p ${this.config.dbPort} ` +
           `-U ${this.config.dbUsername} ` +
           `-d ${this.config.dbName} ` +
           `--verbose --clean --no-owner --no-privileges ` +
           `-f "${outputPath}"`;
  }

  private buildRestoreCommand(inputPath: string): string {
    const psqlPath = process.env.PSQL_PATH || 'psql';
    
    return `PGPASSWORD="${this.config.dbPassword}" ${psqlPath} ` +
           `-h ${this.config.dbHost} ` +
           `-p ${this.config.dbPort} ` +
           `-U ${this.config.dbUsername} ` +
           `-d ${this.config.dbName} ` +
           `-f "${inputPath}"`;
  }

  private async encryptBackup(filePath: string): Promise<string> {
    const encryptedPath = `${filePath}.enc`;
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(encryptedPath);
    
    return new Promise((resolve, reject) => {
      const stream = input.pipe(cipher).pipe(output);
      
      stream.on('finish', () => {
        // Prepend IV to encrypted file for future use
        const encryptedData = fs.readFileSync(encryptedPath);
        const finalData = Buffer.concat([iv, encryptedData]);
        fs.writeFileSync(encryptedPath, finalData);
        resolve(encryptedPath);
      });
      
      stream.on('error', reject);
    });
  }

  private async decryptBackup(encryptedPath: string): Promise<string> {
    const decryptedPath = encryptedPath.replace('.enc', '');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
    
    const encryptedData = fs.readFileSync(encryptedPath);
    const iv = encryptedData.slice(0, 16);
    const encrypted = encryptedData.slice(16);
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    fs.writeFileSync(decryptedPath, decrypted);
    return decryptedPath;
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      for (const backup of backups) {
        if (backup.date < cutoffDate) {
          const backupPath = path.join(this.config.backupDir, backup.filename);
          await fs.promises.unlink(backupPath);
          console.log(`Deleted old backup: ${backup.filename}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI interface
async function main() {
  const backupService = new DatabaseBackupService();
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      await backupService.createBackup();
      break;
      
    case 'restore':
      const backupPath = process.argv[3];
      if (!backupPath) {
        console.error('Please provide backup file path');
        process.exit(1);
      }
      await backupService.restoreBackup(backupPath);
      break;
      
    case 'list':
      const backups = await backupService.listBackups();
      console.log('Available backups:');
      backups.forEach(backup => {
        console.log(`- ${backup.filename} (${backup.size} bytes, ${backup.date})`);
      });
      break;
      
    case 'verify':
      const verifyPath = process.argv[3];
      if (!verifyPath) {
        console.error('Please provide backup file path');
        process.exit(1);
      }
      const isValid = await backupService.verifyBackup(verifyPath);
      console.log(`Backup verification: ${isValid ? 'VALID' : 'INVALID'}`);
      break;
      
    default:
      console.log('Usage:');
      console.log('  npm run backup:create   - Create new backup');
      console.log('  npm run backup:restore <path>  - Restore from backup');
      console.log('  npm run backup:list     - List available backups');
      console.log('  npm run backup:verify <path>   - Verify backup integrity');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseBackupService };