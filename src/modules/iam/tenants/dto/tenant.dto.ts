// =============================================================================
// Tenant DTOs
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  IsNumber,
  IsEnum,
  ValidateNested,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TenantSubscriptionStatus } from '@prisma/client';

class AddressDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  buildingNo?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  doorNo?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  extraDetails?: string;
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  contactFirstName?: string;

  @IsString()
  @IsOptional()
  contactLastName?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  taxOffice?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsEnum(TenantSubscriptionStatus)
  @IsOptional()
  tenantSubscriptionStatus?: TenantSubscriptionStatus;

  @IsString()
  @IsOptional()
  subscriptionPlan?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsUUID('4', { each: true })
  @IsOptional()
  allowedProfileIds?: string[];

  @IsUUID('4', { each: true })
  @IsOptional()
  allowedDeviceProfileIds?: string[];
}

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  contactFirstName?: string;

  @IsString()
  @IsOptional()
  contactLastName?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  taxOffice?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsEnum(TenantSubscriptionStatus)
  @IsOptional()
  tenantSubscriptionStatus?: TenantSubscriptionStatus;

  @IsString()
  @IsOptional()
  subscriptionPlan?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsUUID('4', { each: true })
  @IsOptional()
  allowedProfileIds?: string[];

  @IsUUID('4', { each: true })
  @IsOptional()
  allowedDeviceProfileIds?: string[];
}

export class TenantQueryDto {
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

  @IsEnum(TenantSubscriptionStatus)
  @IsOptional()
  tenantSubscriptionStatus?: TenantSubscriptionStatus;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

