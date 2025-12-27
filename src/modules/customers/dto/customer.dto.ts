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
