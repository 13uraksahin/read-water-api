// =============================================================================
// Meter Profile DTOs - Refactored for Asset/Device Split
// =============================================================================
// REMOVED: communicationConfigs, batteryLifeMonths (now in DeviceProfile)
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  Brand,
  MeterType,
  DialType,
  ConnectionType,
  MountingType,
  TemperatureType,
  IPRating,
  CommunicationModule,
} from '@prisma/client';

export class CreateMeterProfileDto {
  @IsEnum(Brand)
  @IsNotEmpty()
  brand: Brand;

  @IsString()
  @IsNotEmpty()
  modelCode: string;

  @IsEnum(MeterType)
  @IsNotEmpty()
  meterType: MeterType;

  @IsEnum(DialType)
  @IsNotEmpty()
  dialType: DialType;

  @IsEnum(ConnectionType)
  @IsNotEmpty()
  connectionType: ConnectionType;

  @IsEnum(MountingType)
  @IsNotEmpty()
  mountingType: MountingType;

  @IsEnum(TemperatureType)
  @IsNotEmpty()
  temperatureType: TemperatureType;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  diameter?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  length?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  width?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  height?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  q1?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  q2?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  q3?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  q4?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  rValue?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  pressureLoss?: number;

  @IsEnum(IPRating)
  @IsOptional()
  ipRating?: IPRating;

  @IsEnum(CommunicationModule)
  @IsOptional()
  communicationModule?: CommunicationModule;

  // Compatible device profile IDs
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  compatibleDeviceProfileIds?: string[];

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;
}

export class UpdateMeterProfileDto {
  @IsString()
  @IsOptional()
  modelCode?: string;

  @IsEnum(MeterType)
  @IsOptional()
  meterType?: MeterType;

  @IsEnum(DialType)
  @IsOptional()
  dialType?: DialType;

  @IsEnum(ConnectionType)
  @IsOptional()
  connectionType?: ConnectionType;

  @IsEnum(MountingType)
  @IsOptional()
  mountingType?: MountingType;

  @IsEnum(TemperatureType)
  @IsOptional()
  temperatureType?: TemperatureType;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  diameter?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  length?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  width?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  height?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  q1?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  q2?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  q3?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  q4?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  rValue?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  pressureLoss?: number;

  @IsEnum(IPRating)
  @IsOptional()
  ipRating?: IPRating;

  @IsEnum(CommunicationModule)
  @IsOptional()
  communicationModule?: CommunicationModule;

  // Compatible device profile IDs
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  compatibleDeviceProfileIds?: string[];

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;
}

export class MeterProfileQueryDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  page?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  limit?: number;

  @IsEnum(Brand)
  @IsOptional()
  brand?: Brand;

  @IsEnum(MeterType)
  @IsOptional()
  meterType?: MeterType;

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

