// =============================================================================
// Meter Profile DTOs
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Brand,
  MeterType,
  DialType,
  ConnectionType,
  MountingType,
  TemperatureType,
  IPRating,
  CommunicationModule,
  CommunicationTechnology,
} from '@prisma/client';

class CommunicationConfigDto {
  @IsEnum(CommunicationTechnology)
  @IsNotEmpty()
  technology: CommunicationTechnology;

  @IsArray()
  @IsOptional()
  fields?: Array<{
    name: string;
    label: string;
    type: string;
    length?: number;
    regex?: string;
    required: boolean;
    description?: string;
  }>;

  @IsString()
  @IsOptional()
  decoder?: string; // JS decoder function code
}

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
  diameter?: number;

  @IsNumber()
  @IsOptional()
  length?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  q1?: number;

  @IsNumber()
  @IsOptional()
  q2?: number;

  @IsNumber()
  @IsOptional()
  q3?: number;

  @IsNumber()
  @IsOptional()
  q4?: number;

  @IsNumber()
  @IsOptional()
  rValue?: number;

  @IsNumber()
  @IsOptional()
  pressureLoss?: number;

  @IsEnum(IPRating)
  @IsOptional()
  ipRating?: IPRating;

  @IsEnum(CommunicationModule)
  @IsOptional()
  communicationModule?: CommunicationModule;

  @IsNumber()
  @IsOptional()
  batteryLifeMonths?: number;

  @ValidateNested({ each: true })
  @Type(() => CommunicationConfigDto)
  @IsArray()
  @IsOptional()
  communicationConfigs?: CommunicationConfigDto[];

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
  diameter?: number;

  @IsNumber()
  @IsOptional()
  length?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  q1?: number;

  @IsNumber()
  @IsOptional()
  q2?: number;

  @IsNumber()
  @IsOptional()
  q3?: number;

  @IsNumber()
  @IsOptional()
  q4?: number;

  @IsNumber()
  @IsOptional()
  rValue?: number;

  @IsNumber()
  @IsOptional()
  pressureLoss?: number;

  @IsEnum(IPRating)
  @IsOptional()
  ipRating?: IPRating;

  @IsEnum(CommunicationModule)
  @IsOptional()
  communicationModule?: CommunicationModule;

  @IsNumber()
  @IsOptional()
  batteryLifeMonths?: number;

  @ValidateNested({ each: true })
  @Type(() => CommunicationConfigDto)
  @IsArray()
  @IsOptional()
  communicationConfigs?: CommunicationConfigDto[];

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;
}

export class ProfileQueryDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
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

