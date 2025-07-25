import { IsOptional, IsString, IsArray, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user.entity';

export class HierarchyFilterDto {
  @ApiProperty({
    description: 'Zone ID to filter by',
    example: 'zone-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiProperty({
    description: 'Province ID to filter by',
    example: 'province-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  provinceId?: string;

  @ApiProperty({
    description: 'Department ID to filter by',
    example: 'department-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'Cluster ID to filter by',
    example: 'cluster-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  clusterId?: string;

  @ApiProperty({
    description: 'School ID to filter by',
    example: 'school-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({
    description: 'User role to filter by',
    enum: UserRole,
    example: UserRole.TEACHER,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    description: 'Include subordinate levels',
    example: true,
    required: false,
  })
  @IsOptional()
  includeSubordinates?: boolean;

  @ApiProperty({
    description: 'Geographic scope level',
    example: 'province',
    enum: ['zone', 'province', 'department', 'cluster', 'school'],
    required: false,
  })
  @IsOptional()
  @IsString()
  scopeLevel?: string;
}

export class LocationScopeDto {
  @ApiProperty({
    description: 'Zone information',
    required: false,
  })
  @IsOptional()
  zone?: {
    id: string;
    name: string;
    nameKh: string;
  };

  @ApiProperty({
    description: 'Province information',
    required: false,
  })
  @IsOptional()
  province?: {
    id: string;
    name: string;
    nameKh: string;
    zoneId: string;
  };

  @ApiProperty({
    description: 'Department information',
    required: false,
  })
  @IsOptional()
  department?: {
    id: string;
    name: string;
    nameKh: string;
    provinceId: string;
  };

  @ApiProperty({
    description: 'Cluster information',
    required: false,
  })
  @IsOptional()
  cluster?: {
    id: string;
    name: string;
    nameKh: string;
    departmentId: string;
  };

  @ApiProperty({
    description: 'School information',
    required: false,
  })
  @IsOptional()
  school?: {
    id: string;
    name: string;
    nameKh: string;
    clusterId: string;
  };
}

export class BreadcrumbDto {
  @ApiProperty({
    description: 'Breadcrumb level',
    example: 'province',
  })
  @IsString()
  level: string;

  @ApiProperty({
    description: 'Entity ID',
    example: 'province-001',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Entity name in English',
    example: 'Phnom Penh Province',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Entity name in Khmer',
    example: 'ខេត្តភ្នំពេញ',
  })
  @IsString()
  nameKh: string;

  @ApiProperty({
    description: 'URL path for navigation',
    example: '/hierarchy/province/province-001',
  })
  @IsString()
  path: string;
}
