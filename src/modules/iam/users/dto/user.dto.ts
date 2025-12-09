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
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
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

