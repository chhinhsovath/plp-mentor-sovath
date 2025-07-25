import { IsString, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@moeys.gov.kh',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+855123456789',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('KH')
  phoneNumber?: string;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({
    description: 'Preferred language',
    example: 'km',
    enum: ['km', 'en'],
    required: false,
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiProperty({
    description: 'Bio or description',
    example: 'Experienced teacher with 10 years of teaching mathematics',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;
}