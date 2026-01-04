// =============================================================================
// Customer DTOs - Updated for Subscription Model
// =============================================================================
// Address is now on Subscription, not Customer
// =============================================================================

import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATIONAL = 'ORGANIZATIONAL',
}

export class CreateCustomerDto {
  @IsUUID()
  tenantId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  customerNumber?: string;

  @IsEnum(CustomerType)
  customerType: CustomerType;

  @IsObject()
  details: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  customerNumber?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Bulk Import/Export DTOs
// =============================================================================

import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class CustomerQueryDto {
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

  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

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

export class BulkImportCustomersDto {
  @IsOptional()
  rows: Record<string, string>[];
}

export class ExportCustomersQueryDto extends CustomerQueryDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 10000))
  declare limit?: number;
}
