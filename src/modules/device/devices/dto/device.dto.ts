// =============================================================================
// Device DTOs - Inventory Management for Communication Units
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DeviceStatus } from '@prisma/client';

export class CreateDeviceDto {
  // STRICT: A device must be related with at least and only 1 tenant
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  // STRICT: A device must be related with at least and only 1 device profile
  @IsUUID()
  @IsNotEmpty()
  deviceProfileId: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  // Default status is WAREHOUSE
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  // Dynamic fields based on DeviceProfile.fieldDefinitions
  // e.g., { DevEUI: "...", JoinEUI: "...", AppKey: "..." }
  @IsObject()
  @IsNotEmpty()
  dynamicFields: Record<string, string>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDeviceDto {
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  // Dynamic fields can be updated
  @IsObject()
  @IsOptional()
  dynamicFields?: Record<string, string>;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  lastSignalStrength?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  lastBatteryLevel?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class DeviceQueryDto {
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
  deviceProfileId?: string;

  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  technology?: string;

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

export class BulkCreateDeviceDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  deviceProfileId: string;

  // Array of devices to create
  devices: Array<{
    serialNumber: string;
    dynamicFields: Record<string, string>;
    metadata?: Record<string, any>;
  }>;
}
