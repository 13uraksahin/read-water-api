// =============================================================================
// Device Profile DTOs
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CommunicationTechnology, IntegrationType, DeviceBrand } from '@prisma/client';

// Field definition for dynamic fields
export class FieldDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  @IsNotEmpty()
  type: string; // 'hex', 'string', 'number', etc.

  @IsOptional()
  @IsInt()
  length?: number;

  @IsOptional()
  @IsString()
  regex?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

// Communication configuration for a single technology
export class CommunicationConfigDto {
  @IsEnum(CommunicationTechnology)
  @IsNotEmpty()
  technology: CommunicationTechnology;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinitionDto)
  fieldDefinitions: FieldDefinitionDto[];

  @IsOptional()
  @IsString()
  decoderFunction?: string;

  @IsOptional()
  @IsString()
  testPayload?: string;
}

export class CreateDeviceProfileDto {
  @IsEnum(DeviceBrand)
  @IsNotEmpty()
  brand: DeviceBrand;

  @IsString()
  @IsNotEmpty()
  modelCode: string;

  // Primary communication technology (for backward compatibility)
  @IsEnum(CommunicationTechnology)
  @IsOptional()
  communicationTechnology?: CommunicationTechnology;

  @IsOptional()
  @IsEnum(IntegrationType)
  integrationType?: IntegrationType;

  // Legacy: Single set of field definitions (for backward compatibility)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinitionDto)
  fieldDefinitions?: FieldDefinitionDto[];

  // NEW: Multiple communication configurations (0, 1 or more technologies)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunicationConfigDto)
  communicationConfigs?: CommunicationConfigDto[];

  @IsOptional()
  @IsString()
  decoderFunction?: string;

  @IsOptional()
  @IsString()
  testPayload?: string;

  @IsOptional()
  expectedOutput?: any;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  batteryLifeMonths?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleMeterProfileIds?: string[];
}

export class UpdateDeviceProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  modelCode?: string;

  @IsOptional()
  @IsEnum(CommunicationTechnology)
  communicationTechnology?: CommunicationTechnology;

  @IsOptional()
  @IsEnum(IntegrationType)
  integrationType?: IntegrationType;

  // Legacy: Single set of field definitions (for backward compatibility)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinitionDto)
  fieldDefinitions?: FieldDefinitionDto[];

  // NEW: Multiple communication configurations (0, 1 or more technologies)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommunicationConfigDto)
  communicationConfigs?: CommunicationConfigDto[];

  @IsOptional()
  @IsString()
  decoderFunction?: string;

  @IsOptional()
  @IsString()
  testPayload?: string;

  @IsOptional()
  expectedOutput?: any;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  batteryLifeMonths?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleMeterProfileIds?: string[];
}

export class DeviceProfileQueryDto {
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

  @IsOptional()
  @IsEnum(DeviceBrand)
  brand?: DeviceBrand;

  @IsOptional()
  @IsEnum(CommunicationTechnology)
  technology?: CommunicationTechnology;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
