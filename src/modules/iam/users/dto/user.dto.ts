// =============================================================================
// User DTOs
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  MinLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SystemRole } from '@prisma/client';

class TenantAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsEnum(SystemRole)
  @IsNotEmpty()
  role: SystemRole;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  tcIdNo?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @ValidateNested({ each: true })
  @Type(() => TenantAssignmentDto)
  @IsArray()
  @IsOptional()
  tenants?: TenantAssignmentDto[];
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  tcIdNo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ValidateNested({ each: true })
  @Type(() => TenantAssignmentDto)
  @IsArray()
  @IsOptional()
  tenants?: TenantAssignmentDto[];
}

export class AssignTenantDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsEnum(SystemRole)
  @IsNotEmpty()
  role: SystemRole;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class UserQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsEnum(SystemRole)
  @IsOptional()
  role?: SystemRole;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

