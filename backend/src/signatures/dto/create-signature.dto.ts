import { IsString, IsNotEmpty, IsDateString, IsUUID, IsOptional, IsBase64 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSignatureDto {
  @ApiProperty({
    description: 'Observation session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Role of the signer',
    example: 'teacher',
    enum: ['teacher', 'observer', 'supervisor', 'director'],
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: 'Name of the signer',
    example: 'សុខ ប៊ុនធឿន',
  })
  @IsString()
  @IsNotEmpty()
  signerName: string;

  @ApiProperty({
    description: 'Date of signing',
    example: '2025-07-19',
  })
  @IsDateString()
  @IsNotEmpty()
  signedDate: string;

  @ApiProperty({
    description: 'Digital signature data (base64 encoded)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    required: false,
  })
  @IsOptional()
  @IsString()
  signatureData?: string;

  @ApiProperty({
    description: 'Signature method',
    example: 'digital_pad',
    enum: ['digital_pad', 'typed_name', 'uploaded_image', 'electronic_id'],
    required: false,
  })
  @IsOptional()
  @IsString()
  signatureMethod?: string;

  @ApiProperty({
    description: 'IP address of the signer',
    example: '192.168.1.100',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent of the signing device',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'Additional metadata for the signature',
    example: '{"device": "tablet", "location": "school_office"}',
    required: false,
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}
