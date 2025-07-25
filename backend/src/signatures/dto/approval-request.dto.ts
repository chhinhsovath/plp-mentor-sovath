import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_CHANGES = 'request_changes',
  DELEGATE = 'delegate',
}

export class ApprovalRequestDto {
  @ApiProperty({
    description: 'Observation session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Approval action',
    enum: ApprovalAction,
    example: ApprovalAction.APPROVE,
  })
  @IsEnum(ApprovalAction)
  @IsNotEmpty()
  action: ApprovalAction;

  @ApiProperty({
    description: 'Comments or reason for the approval decision',
    example: 'ការសង្កេតនេះបានបំពេញតាមស្តង់ដារ',
    required: false,
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({
    description: 'User ID to delegate approval to (for delegate action)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  delegateToUserId?: string;

  @ApiProperty({
    description: 'Digital signature for the approval',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    required: false,
  })
  @IsOptional()
  @IsString()
  signatureData?: string;
}
