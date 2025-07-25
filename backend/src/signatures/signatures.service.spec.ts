import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { Signature } from '../entities/signature.entity';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { User, UserRole } from '../entities/user.entity';
import { AuditTrailService } from './audit-trail.service';

describe('SignaturesService', () => {
  let service: SignaturesService;
  let signatureRepository: Repository<Signature>;
  let sessionRepository: Repository<ObservationSession>;
  let userRepository: Repository<User>;
  let auditTrailService: AuditTrailService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    fullName: 'Test User',
    role: UserRole.TEACHER,
    email: 'test@example.com',
  };

  const mockSession = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    observerId: mockUser.id,
    teacherName: 'Test Teacher',
    observerName: 'Test Observer',
    status: SessionStatus.COMPLETED,
    observer: mockUser,
    signatures: [],
  };

  const mockSignature = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    sessionId: mockSession.id,
    role: 'teacher',
    signerName: 'Test Teacher',
    signedDate: new Date(),
    session: mockSession,
  };

  const mockCreateSignatureDto = {
    sessionId: mockSession.id,
    role: 'teacher',
    signerName: 'Test Teacher',
    signedDate: '2025-07-19',
    signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    signatureMethod: 'digital_pad',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignaturesService,
        {
          provide: getRepositoryToken(Signature),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ObservationSession),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AuditTrailService,
          useValue: {
            logSignatureEvent: jest.fn(),
            logApprovalEvent: jest.fn(),
            getSignatureAuditTrail: jest.fn(),
            getSessionAuditTrail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SignaturesService>(SignaturesService);
    signatureRepository = module.get<Repository<Signature>>(getRepositoryToken(Signature));
    sessionRepository = module.get<Repository<ObservationSession>>(
      getRepositoryToken(ObservationSession),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    auditTrailService = module.get<AuditTrailService>(AuditTrailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new signature successfully', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);
      jest.spyOn(signatureRepository, 'create').mockReturnValue(mockSignature as Signature);
      jest.spyOn(signatureRepository, 'save').mockResolvedValue(mockSignature as Signature);
      jest.spyOn(auditTrailService, 'logSignatureEvent').mockResolvedValue();

      const result = await service.create(mockCreateSignatureDto, mockUser as User);

      expect(result).toEqual(mockSignature);
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCreateSignatureDto.sessionId },
        relations: ['observer', 'signatures'],
      });
      expect(signatureRepository.create).toHaveBeenCalled();
      expect(signatureRepository.save).toHaveBeenCalled();
      expect(auditTrailService.logSignatureEvent).toHaveBeenCalled();
    });

    it('should throw NotFoundException when session does not exist', async () => {
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(mockCreateSignatureDto, mockUser as User)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user cannot sign session', async () => {
      const otherUserSession = { ...mockSession, teacherName: 'Other Teacher' };
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(otherUserSession as ObservationSession);

      await expect(service.create(mockCreateSignatureDto, mockUser as User)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when signature already exists for role', async () => {
      const sessionWithSignature = {
        ...mockSession,
        signatures: [{ role: 'teacher', signerName: 'Existing Teacher' }],
      };
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(sessionWithSignature as ObservationSession);

      await expect(service.create(mockCreateSignatureDto, mockUser as User)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate signature data when provided', async () => {
      const invalidSignatureDto = {
        ...mockCreateSignatureDto,
        signatureData: 'invalid-data',
      };

      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as ObservationSession);

      await expect(service.create(invalidSignatureDto, mockUser as User)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findBySession', () => {
    it('should return signatures for a session', async () => {
      const signatures = [mockSignature];
      jest.spyOn(signatureRepository, 'find').mockResolvedValue(signatures as Signature[]);

      const result = await service.findBySession(mockSession.id);

      expect(result).toEqual(signatures);
      expect(signatureRepository.find).toHaveBeenCalledWith({
        where: { sessionId: mockSession.id },
        order: {
          signedDate: 'ASC',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return signature by ID', async () => {
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(mockSignature as Signature);

      const result = await service.findOne(mockSignature.id);

      expect(result).toEqual(mockSignature);
      expect(signatureRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSignature.id },
        relations: ['session', 'session.observer'],
      });
    });

    it('should throw NotFoundException when signature not found', async () => {
      jest.spyOn(signatureRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateSignatureData', () => {
    it('should validate valid signature data', async () => {
      const validSignatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';

      const result = await service.validateSignatureData(validSignatureData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.signatureHash).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should reject invalid signature data format', async () => {
      const invalidSignatureData = 'invalid-data';

      const result = await service.validateSignatureData(invalidSignatureData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Signature data must be a valid image data URL');
    });

    it('should reject oversized signature data', async () => {
      // Create a large signature data string (over 1MB)
      const largeSignatureData = 'data:image/png;base64,' + 'A'.repeat(2000000);

      const result = await service.validateSignatureData(largeSignatureData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Signature data exceeds maximum size limit');
    });
  });

  describe('getSignatureRequirements', () => {
    it('should return signature requirements for a session', async () => {
      const sessionWithSignatures = {
        ...mockSession,
        signatures: [{ role: 'teacher' }],
      };
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(sessionWithSignatures as ObservationSession);

      const result = await service.getSignatureRequirements(mockSession.id);

      expect(result.requiredSignatures).toContain('teacher');
      expect(result.requiredSignatures).toContain('observer');
      expect(result.completedSignatures).toContain('teacher');
      expect(result.pendingSignatures).toContain('observer');
      expect(result.canProceed).toBe(false);
    });

    it('should indicate when all signatures are complete', async () => {
      const sessionWithAllSignatures = {
        ...mockSession,
        signatures: [{ role: 'teacher' }, { role: 'observer' }, { role: 'supervisor' }],
      };
      jest
        .spyOn(sessionRepository, 'findOne')
        .mockResolvedValue(sessionWithAllSignatures as ObservationSession);

      const result = await service.getSignatureRequirements(mockSession.id);

      expect(result.pendingSignatures).toHaveLength(0);
      expect(result.canProceed).toBe(true);
    });
  });

  describe('removeSignature', () => {
    it('should remove signature when user is authorized', async () => {
      const adminUser = { ...mockUser, role: UserRole.ADMINISTRATOR };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSignature as Signature);
      jest.spyOn(signatureRepository, 'remove').mockResolvedValue(mockSignature as Signature);
      jest.spyOn(auditTrailService, 'logSignatureEvent').mockResolvedValue();

      await service.removeSignature(mockSignature.id, adminUser as User);

      expect(signatureRepository.remove).toHaveBeenCalledWith(mockSignature);
      expect(auditTrailService.logSignatureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'signature_removed',
          userId: adminUser.id,
        }),
      );
    });

    it('should throw ForbiddenException when user cannot remove signature', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockSignature as Signature);

      await expect(service.removeSignature(mockSignature.id, mockUser as User)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getSignatureStatistics', () => {
    it('should return signature statistics', async () => {
      const signatures = [
        { role: 'teacher', signedDate: new Date('2025-01-15') },
        { role: 'observer', signedDate: new Date('2025-01-16') },
        { role: 'teacher', signedDate: new Date('2025-02-10') },
      ];
      jest.spyOn(signatureRepository, 'find').mockResolvedValue(signatures as Signature[]);

      const result = await service.getSignatureStatistics();

      expect(result.totalSignatures).toBe(3);
      expect(result.signaturesByRole.teacher).toBe(2);
      expect(result.signaturesByRole.observer).toBe(1);
      expect(result.signaturesByMonth['2025-01']).toBe(2);
      expect(result.signaturesByMonth['2025-02']).toBe(1);
      expect(result.verificationRate).toBeDefined();
    });
  });
});
