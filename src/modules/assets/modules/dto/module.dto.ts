// =============================================================================
// Module DTOs - Communication Modules Management
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsObject,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DeviceStatus, CommunicationTechnology } from '@prisma/client';

// Note: Using DeviceStatus from Prisma as the database model is still named "Device"
export { DeviceStatus as ModuleStatus } from '@prisma/client';

export class CreateModuleDto {
  // STRICT: A module must be related with at least and only 1 tenant
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  // STRICT: A module must be related with at least and only 1 module profile
  @IsUUID()
  @IsNotEmpty()
  moduleProfileId: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  // Default status is WAREHOUSE
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  // Selected communication technology (required if profile has multiple technologies)
  @IsEnum(CommunicationTechnology)
  @IsOptional()
  selectedTechnology?: CommunicationTechnology;

  // Active scenario IDs for this module (from the profile's scenarios)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  activeScenarioIds?: string[];

  // Dynamic fields based on ModuleProfile.fieldDefinitions
  // e.g., { DevEUI: "...", JoinEUI: "...", AppKey: "..." }
  @IsObject()
  @IsNotEmpty()
  dynamicFields: Record<string, string>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateModuleDto {
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  // Selected communication technology can be changed
  @IsEnum(CommunicationTechnology)
  @IsOptional()
  selectedTechnology?: CommunicationTechnology;

  // Active scenario IDs can be updated
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  activeScenarioIds?: string[];

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

export class ModuleQueryDto {
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
  moduleProfileId?: string;

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

export class BulkCreateModuleDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  moduleProfileId: string;

  // Array of modules to create
  modules: Array<{
    serialNumber: string;
    dynamicFields: Record<string, string>;
    metadata?: Record<string, any>;
  }>;
}

// =============================================================================
// Bulk Import/Export DTOs
// =============================================================================

export class BulkImportModuleRowDto {
  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  // Dynamic fields will be parsed from CSV columns
  [key: string]: string;
}

export class BulkImportModulesDto {
  @IsOptional()
  rows: Record<string, string>[];

  @IsString()
  @IsOptional()
  namePrefix?: string;

  @IsString()
  @IsOptional()
  nameSuffix?: string;

  @IsUUID()
  @IsNotEmpty()
  moduleProfileId: string;
}

export class ExportModulesQueryDto extends ModuleQueryDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 10000))
  declare limit?: number;
}

// Legacy aliases for backward compatibility during migration
export {
  CreateModuleDto as CreateDeviceDto,
  UpdateModuleDto as UpdateDeviceDto,
  ModuleQueryDto as DeviceQueryDto,
  BulkCreateModuleDto as BulkCreateDeviceDto,
};
