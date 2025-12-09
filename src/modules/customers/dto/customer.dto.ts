// =============================================================================
// Customer DTOs
// =============================================================================

import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsNumber,
  IsUUID,
} from 'class-validator';

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATIONAL = 'ORGANIZATIONAL',
}

export enum ConsumptionType {
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export class CreateCustomerDto {
  @IsUUID()
  tenantId: string;

  @IsEnum(CustomerType)
  customerType: CustomerType;

  @IsOptional()
  @IsEnum(ConsumptionType)
  consumptionType?: ConsumptionType;

  @IsObject()
  details: Record<string, unknown>;

  @IsObject()
  address: Record<string, unknown>;

  @IsOptional()
  @IsString()
  addressCode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsEnum(ConsumptionType)
  consumptionType?: ConsumptionType;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  address?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  addressCode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
