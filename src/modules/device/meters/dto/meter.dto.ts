// =============================================================================
// Meter DTOs - Refactored for Asset/Device Split
// =============================================================================
// REMOVED: All connectivity_config, communication fields
// Meters are now pure assets - connectivity is handled by Device entity
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
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MeterStatus, ValveStatus } from '@prisma/client';

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

export class CreateMeterDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  // STRICT: A meter must be related with at least and only 1 customer
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  // STRICT: A meter must be related with at least and only 1 meter profile
  @IsUUID()
  @IsNotEmpty()
  meterProfileId: string;

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

  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @IsString()
  @IsOptional()
  addressCode?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  longitude?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateMeterDto {
  @IsUUID()
  @IsOptional()
  customerId?: string;

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

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @IsString()
  @IsOptional()
  addressCode?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  longitude?: number;

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
  customerId?: string;

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
