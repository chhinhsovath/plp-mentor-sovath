import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user.entity';
import { IsStrongPassword } from '../validators/strong-password.validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Unique username',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@moeys.gov.kh',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters with uppercase, lowercase, number, and special character)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.TEACHER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Location scope for the user',
    example: 'Phnom Penh',
    required: false,
  })
  @IsOptional()
  @IsString()
  locationScope?: string;

  @ApiProperty({
    description: 'Zone ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiProperty({
    description: 'Province ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  provinceId?: string;

  @ApiProperty({
    description: 'Department ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'Cluster ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  clusterId?: string;

  @ApiProperty({
    description: 'School ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolId?: string;
}
