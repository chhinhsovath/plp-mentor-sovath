import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignatureVerificationDto {
  @ApiProperty({
    description: 'Signature ID to verify',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  signatureId: string;

  @ApiProperty({
    description: 'Verification method',
    example: 'visual_comparison',
    enum: ['visual_comparison', 'biometric_match', 'digital_certificate', 'witness_verification'],
    required: false,
  })
  @IsOptional()
  @IsString()
  verificationMethod?: string;

  @ApiProperty({
    description: 'Verification result',
    example: 'verified',
    enum: ['verified', 'rejected', 'pending', 'disputed'],
    required: false,
  })
  @IsOptional()
  @IsString()
  verificationResult?: string;

  @ApiProperty({
    description: 'Verifier comments',
    example: 'ហត្ថលេខាត្រឹមត្រូវតាមឯកសារយោង',
    required: false,
  })
  @IsOptional()
  @IsString()
  verifierComments?: string;
}
