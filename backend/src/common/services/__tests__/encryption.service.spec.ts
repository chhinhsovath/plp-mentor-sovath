import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              switch (key) {
                case 'ENCRYPTION_KEY':
                  return 'test-encryption-key-for-testing-only';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'This is sensitive data';
      const encrypted = service.encrypt(originalText);
      const decrypted = service.decrypt(encrypted);

      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toContain(':'); // Should contain separators
      expect(decrypted).toBe(originalText);
    });

    it('should handle empty strings', () => {
      expect(service.encrypt('')).toBe('');
      expect(service.decrypt('')).toBe('');
    });

    it('should handle null/undefined values', () => {
      expect(service.encrypt(null as any)).toBe(null);
      expect(service.decrypt(null as any)).toBe(null);
    });

    it('should return different encrypted values for same input', () => {
      const text = 'test data';
      const encrypted1 = service.encrypt(text);
      const encrypted2 = service.encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
      expect(service.decrypt(encrypted1)).toBe(text);
      expect(service.decrypt(encrypted2)).toBe(text);
    });

    it('should handle malformed encrypted data gracefully', () => {
      const malformedData = 'not-encrypted-data';
      const result = service.decrypt(malformedData);
      expect(result).toBe(malformedData); // Should return original if decryption fails
    });
  });

  describe('hash and verifyHash', () => {
    it('should hash data correctly', () => {
      const data = 'password123';
      const hashed = service.hash(data);

      expect(hashed).not.toBe(data);
      expect(hashed).toContain(':'); // Should contain salt separator
      expect(hashed.length).toBeGreaterThan(64); // Should be long enough
    });

    it('should verify hashed data correctly', () => {
      const data = 'password123';
      const hashed = service.hash(data);

      expect(service.verifyHash(data, hashed)).toBe(true);
      expect(service.verifyHash('wrongpassword', hashed)).toBe(false);
    });

    it('should generate different hashes for same input', () => {
      const data = 'password123';
      const hash1 = service.hash(data);
      const hash2 = service.hash(data);

      expect(hash1).not.toBe(hash2);
      expect(service.verifyHash(data, hash1)).toBe(true);
      expect(service.verifyHash(data, hash2)).toBe(true);
    });

    it('should handle malformed hash data', () => {
      const data = 'password123';
      const malformedHash = 'not-a-hash';

      expect(service.verifyHash(data, malformedHash)).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate secure tokens of correct length', () => {
      const token = service.generateSecureToken(32);
      expect(token).toHaveLength(64); // Hex encoding doubles the length
      expect(/^[a-f0-9]+$/.test(token)).toBe(true); // Should be hex
    });

    it('should generate different tokens each time', () => {
      const token1 = service.generateSecureToken();
      const token2 = service.generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate passwords of correct length', () => {
      const password = service.generateSecurePassword(12);
      expect(password).toHaveLength(12);
    });

    it('should generate different passwords each time', () => {
      const password1 = service.generateSecurePassword();
      const password2 = service.generateSecurePassword();
      expect(password1).not.toBe(password2);
    });

    it('should contain mixed character types', () => {
      const password = service.generateSecurePassword(20);
      expect(/[a-z]/.test(password)).toBe(true); // lowercase
      expect(/[A-Z]/.test(password)).toBe(true); // uppercase
      expect(/[0-9]/.test(password)).toBe(true); // numbers
      expect(/[!@#$%^&*]/.test(password)).toBe(true); // special chars
    });
  });

  describe('error handling', () => {
    it('should throw error if encryption key is not provided', () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(null),
      };

      expect(() => {
        new EncryptionService(mockConfigService as any);
      }).toThrow('ENCRYPTION_KEY must be set in environment variables');
    });
  });
});