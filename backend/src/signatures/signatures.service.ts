import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signature, SignerRole } from '../entities/signature.entity';
import { ObservationSession, SessionStatus } from '../entities/observation-session.entity';
import { User } from '../entities/user.entity';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { SignatureVerificationDto } from './dto/signature-verification.dto';
import { AuditTrailService } from './audit-trail.service';
import * as crypto from 'crypto';

export interface SignatureValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  signatureHash: string;
  timestamp: Date;
}

export interface SignatureMetadata {
  device?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionDuration?: number;
}

@Injectable()
export class SignaturesService {
  constructor(
    @InjectRepository(Signature)
    private signatureRepository: Repository<Signature>,
    @InjectRepository(ObservationSession)
    private sessionRepository: Repository<ObservationSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditTrailService: AuditTrailService,
  ) {}

  async create(createSignatureDto: CreateSignatureDto, currentUser: User): Promise<Signature> {
    // Validate that the session exists
    const session = await this.sessionRepository.findOne({
      where: { id: createSignatureDto.sessionId },
      relations: ['observer', 'signatures'],
    });

    if (!session) {
      throw new NotFoundException(
        `Observation session with ID '${createSignatureDto.sessionId}' not found`,
      );
    }

    // Check if user can sign this session
    const canSign = await this.canSignSession(session, createSignatureDto.role, currentUser);
    if (!canSign) {
      throw new ForbiddenException('You are not authorized to sign this session');
    }

    // Check if signature already exists for this role
    const existingSignature = session.signatures?.find(
      (sig) => sig.role === createSignatureDto.role,
    );
    if (existingSignature) {
      throw new BadRequestException(
        `Signature for role '${createSignatureDto.role}' already exists`,
      );
    }

    // Validate signature data if provided
    if (createSignatureDto.signatureData) {
      const validationResult = await this.validateSignatureData(createSignatureDto.signatureData);
      if (!validationResult.isValid) {
        throw new BadRequestException(
          `Invalid signature data: ${validationResult.errors.join(', ')}`,
        );
      }
    }

    // Create signature metadata
    const metadata: SignatureMetadata = {
      timestamp: new Date(),
      ipAddress: createSignatureDto.ipAddress,
      userAgent: createSignatureDto.userAgent,
    };

    if (createSignatureDto.metadata) {
      try {
        const additionalMetadata = JSON.parse(createSignatureDto.metadata);
        Object.assign(metadata, additionalMetadata);
      } catch (error) {
        // Invalid JSON metadata, continue without it
      }
    }

    // Create the signature
    const signature = this.signatureRepository.create({
      sessionId: createSignatureDto.sessionId,
      role: createSignatureDto.role as SignerRole,
      signerName: createSignatureDto.signerName,
      signatureData: createSignatureDto.signatureData || null,
    });

    const savedSignature = await this.signatureRepository.save(signature);

    // Create audit trail entry
    await this.auditTrailService.logSignatureEvent({
      signatureId: savedSignature.id,
      sessionId: createSignatureDto.sessionId,
      action: 'signature_created',
      userId: currentUser.id,
      userRole: currentUser.role,
      metadata: JSON.stringify(metadata),
      timestamp: new Date(),
    });

    return savedSignature;
  }

  async findBySession(sessionId: string): Promise<Signature[]> {
    return this.signatureRepository.find({
      where: { sessionId },
      order: {
        signedDate: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Signature> {
    const signature = await this.signatureRepository.findOne({
      where: { id },
      relations: ['session', 'session.observer'],
    });

    if (!signature) {
      throw new NotFoundException(`Signature with ID '${id}' not found`);
    }

    return signature;
  }

  async verifySignature(
    signatureId: string,
    verificationDto: SignatureVerificationDto,
    currentUser: User,
  ): Promise<Signature> {
    const signature = await this.findOne(signatureId);

    // Check if user can verify signatures
    const canVerify = await this.canVerifySignature(currentUser);
    if (!canVerify) {
      throw new ForbiddenException('You are not authorized to verify signatures');
    }

    // Create audit trail entry for verification
    await this.auditTrailService.logSignatureEvent({
      signatureId,
      sessionId: signature.sessionId,
      action: 'signature_verified',
      userId: currentUser.id,
      userRole: currentUser.role,
      metadata: JSON.stringify({
        verificationMethod: verificationDto.verificationMethod,
        verificationResult: verificationDto.verificationResult,
        verifierComments: verificationDto.verifierComments,
      }),
      timestamp: new Date(),
    });

    return signature;
  }

  async validateSignatureData(signatureData: string): Promise<SignatureValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic format validation
    if (!signatureData.startsWith('data:image/')) {
      errors.push('Signature data must be a valid image data URL');
    }

    // Size validation
    const sizeInBytes = (signatureData.length * 3) / 4;
    const maxSizeInBytes = 1024 * 1024; // 1MB
    if (sizeInBytes > maxSizeInBytes) {
      errors.push('Signature data exceeds maximum size limit');
    }

    // Generate signature hash for integrity
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      signatureHash,
      timestamp: new Date(),
    };
  }

  async getSignatureRequirements(sessionId: string): Promise<{
    requiredSignatures: SignerRole[];
    completedSignatures: SignerRole[];
    pendingSignatures: SignerRole[];
    canProceed: boolean;
  }> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['signatures', 'observer'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID '${sessionId}' not found`);
    }

    // Define required signatures based on session type and status
    const requiredSignatures: SignerRole[] = [SignerRole.TEACHER, SignerRole.OBSERVER];

    const completedSignatures = session.signatures?.map((sig) => sig.role) || [];
    const pendingSignatures = requiredSignatures.filter(
      (role) => !completedSignatures.includes(role),
    );
    const canProceed = pendingSignatures.length === 0;

    return {
      requiredSignatures,
      completedSignatures,
      pendingSignatures,
      canProceed,
    };
  }

  async removeSignature(id: string, currentUser: User): Promise<void> {
    const signature = await this.findOne(id);

    // Check if user can remove this signature
    const canRemove = await this.canRemoveSignature(signature, currentUser);
    if (!canRemove) {
      throw new ForbiddenException('You are not authorized to remove this signature');
    }

    // Create audit trail entry
    await this.auditTrailService.logSignatureEvent({
      signatureId: id,
      sessionId: signature.sessionId,
      action: 'signature_removed',
      userId: currentUser.id,
      userRole: currentUser.role,
      metadata: JSON.stringify({ reason: 'manual_removal' }),
      timestamp: new Date(),
    });

    await this.signatureRepository.remove(signature);
  }

  async getSignatureStatistics(): Promise<{
    totalSignatures: number;
    signaturesByRole: Record<string, number>;
    signaturesByMonth: Record<string, number>;
    verificationRate: number;
  }> {
    const signatures = await this.signatureRepository.find({
      relations: ['session'],
    });

    const signaturesByRole: Record<string, number> = {};
    const signaturesByMonth: Record<string, number> = {};

    signatures.forEach((signature) => {
      // Count by role
      signaturesByRole[signature.role] = (signaturesByRole[signature.role] || 0) + 1;

      // Count by month
      const monthKey = signature.signedDate.toISOString().substring(0, 7); // YYYY-MM
      signaturesByMonth[monthKey] = (signaturesByMonth[monthKey] || 0) + 1;
    });

    return {
      totalSignatures: signatures.length,
      signaturesByRole,
      signaturesByMonth,
      verificationRate: 0.95, // Placeholder - would be calculated from verification data
    };
  }

  private async canSignSession(
    session: ObservationSession,
    role: string,
    currentUser: User,
  ): Promise<boolean> {
    switch (role) {
      case 'teacher':
        // Teacher can sign their own observation session
        return session.teacherName === currentUser.fullName;

      case 'observer':
        // Observer can sign sessions they conducted
        return session.observerId === currentUser.id;

      case 'supervisor':
      case 'director':
        // Supervisors and directors can sign based on hierarchy
        return ['Administrator', 'Zone', 'Provincial', 'Director'].includes(currentUser.role);

      default:
        return false;
    }
  }

  private async canVerifySignature(currentUser: User): Promise<boolean> {
    // Only supervisors and administrators can verify signatures
    return ['Administrator', 'Zone', 'Provincial', 'Director'].includes(currentUser.role);
  }

  private async canRemoveSignature(signature: Signature, currentUser: User): Promise<boolean> {
    // Only administrators can remove signatures
    return currentUser.role === 'Administrator';
  }
}
