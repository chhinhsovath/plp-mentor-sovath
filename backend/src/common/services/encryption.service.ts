import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY must be set in environment variables');
    }
    
    // Derive a consistent key from the provided key
    this.encryptionKey = crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): string {
    if (!text) return text;

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Using HMAC for integrity
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(encrypted);
    const tag = hmac.digest('hex');
    
    // Combine iv, tag, and encrypted data
    return iv.toString('hex') + ':' + tag + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) return encryptedData;

      const iv = Buffer.from(parts[0], 'hex');
      const expectedTag = parts[1];
      const encrypted = parts[2];

      // Verify integrity using HMAC
      const hmac = crypto.createHmac('sha256', this.encryptionKey);
      hmac.update(encrypted);
      const actualTag = hmac.digest('hex');
      
      if (actualTag !== expectedTag) {
        throw new Error('Data integrity check failed');
      }

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // If decryption fails, return original data (might be unencrypted legacy data)
      console.warn('Decryption failed, returning original data:', error.message);
      return encryptedData;
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return actualSalt + ':' + hash.toString('hex');
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    const parts = hashedData.split(':');
    if (parts.length !== 2) return false;

    const salt = parts[0];
    const hash = parts[1];
    const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
    
    return hash === newHash;
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure random password
   */
  generateSecurePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
}