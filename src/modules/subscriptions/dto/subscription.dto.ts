// =============================================================================
// Subscription DTOs
// =============================================================================

import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum SubscriptionType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATIONAL = 'ORGANIZATIONAL',
}

export enum SubscriptionGroup {
  NORMAL_CONSUMPTION = 'NORMAL_CONSUMPTION',
  HIGH_CONSUMPTION = 'HIGH_CONSUMPTION',
}

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
  addressCode?: string;

  @IsString()
  @IsOptional()
  extraDetails?: string;
}

export class CreateSubscriptionDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  subscriptionNumber: string;

  @IsUUID()
  customerId: string;

  @IsEnum(SubscriptionType)
  subscriptionType: SubscriptionType;

  @IsOptional()
  @IsEnum(SubscriptionGroup)
  subscriptionGroup?: SubscriptionGroup;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsString()
  addressCode?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subscriptionNumber?: string;

  @IsOptional()
  @IsEnum(SubscriptionType)
  subscriptionType?: SubscriptionType;

  @IsOptional()
  @IsEnum(SubscriptionGroup)
  subscriptionGroup?: SubscriptionGroup;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsString()
  addressCode?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SubscriptionQueryDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  limit?: number;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsEnum(SubscriptionType)
  subscriptionType?: SubscriptionType;

  @IsOptional()
  @IsEnum(SubscriptionGroup)
  subscriptionGroup?: SubscriptionGroup;

  @IsOptional()
  @IsString()
  search?: string;
}

