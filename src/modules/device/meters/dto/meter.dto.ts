// =============================================================================
// Meter DTOs
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
import { Type } from 'class-transformer';
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

class ConnectivityFieldsDto {
  @IsString()
  @IsNotEmpty()
  technology: string;

  @IsObject()
  @IsNotEmpty()
  fields: Record<string, string>;
}

class ConnectivityConfigDto {
  @ValidateNested()
  @Type(() => ConnectivityFieldsDto)
  @IsOptional()
  primary?: ConnectivityFieldsDto;

  @ValidateNested()
  @Type(() => ConnectivityFieldsDto)
  @IsOptional()
  secondary?: ConnectivityFieldsDto;

  @ValidateNested({ each: true })
  @Type(() => ConnectivityFieldsDto)
  @IsOptional()
  others?: ConnectivityFieldsDto[];
}

export class CreateMeterDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsUUID()
  @IsNotEmpty()
  meterProfileId: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsNumber()
  @IsOptional()
  initialIndex?: number;

  @IsDateString()
  @IsNotEmpty()
  installationDate: string;

  @IsEnum(MeterStatus)
  @IsOptional()
  status?: MeterStatus;

  @ValidateNested()
  @Type(() => ConnectivityConfigDto)
  @IsOptional()
  connectivityConfig?: ConnectivityConfigDto;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @IsString()
  @IsOptional()
  addressCode?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
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
  @Type(() => ConnectivityConfigDto)
  @IsOptional()
  connectivityConfig?: ConnectivityConfigDto;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @IsString()
  @IsOptional()
  addressCode?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class MeterQueryDto {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
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

