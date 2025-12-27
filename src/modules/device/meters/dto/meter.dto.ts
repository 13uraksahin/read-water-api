// =============================================================================
// Meter DTOs - Updated for Subscription Model
// =============================================================================
// Address is now on Subscription, not Meter
// Meters are linked to Subscriptions, not directly to Customers
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MeterStatus, ValveStatus } from '@prisma/client';

export class CreateMeterDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  // STRICT: A meter must be related with at least and only 1 meter profile
  @IsUUID()
  @IsNotEmpty()
  meterProfileId: string;

  // Subscription is optional - meter can be in warehouse without subscription
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  initialIndex?: number;

  @IsDateString()
  @IsNotEmpty()
  installationDate: string;

  @IsEnum(MeterStatus)
  @IsOptional()
  status?: MeterStatus;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateMeterDto {
  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @IsUUID()
  @IsOptional()
  meterProfileId?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsEnum(MeterStatus)
  @IsOptional()
  status?: MeterStatus;

  @IsEnum(ValveStatus)
  @IsOptional()
  valveStatus?: ValveStatus;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class MeterQueryDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  page?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  limit?: number;

  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsUUID()
  @IsOptional()
  subscriptionId?: string;

  @IsEnum(MeterStatus)
  @IsOptional()
  status?: MeterStatus;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class ControlValveDto {
  @IsEnum(ValveStatus)
  @IsNotEmpty()
  action: 'OPEN' | 'CLOSED';
}

// Link/Unlink Device DTOs
export class LinkDeviceDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId: string;
}

export class UnlinkDeviceDto {
  @IsEnum(['WAREHOUSE', 'MAINTENANCE'])
  @IsOptional()
  deviceStatus?: 'WAREHOUSE' | 'MAINTENANCE';
}

// Link Subscription DTO
export class LinkSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  subscriptionId: string;
}
