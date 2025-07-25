import { IsEmail, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../validators/strong-password.validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token received via email' })
  @IsString()
  @IsUUID()
  token: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password (minimum 8 characters with uppercase, lowercase, number, and special character)', minLength: 8 })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123!', description: 'Current password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password (minimum 8 characters with uppercase, lowercase, number, and special character)', minLength: 8 })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}