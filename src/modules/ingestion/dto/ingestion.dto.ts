// =============================================================================
// Ingestion DTOs
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsObject,
  IsDateString,
} from 'class-validator';
import { CommunicationTechnology } from '@prisma/client';

/**
 * Raw reading payload from IoT devices
 * This DTO is minimal for high-performance intake
 */
export class IngestReadingDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string; // Can be DevEUI, Sigfox ID, IMEI, etc.

  @IsString()
  @IsNotEmpty()
  payload: string; // Raw hex payload from device

  @IsEnum(CommunicationTechnology)
  @IsNotEmpty()
  technology: CommunicationTechnology;

  @IsDateString()
  @IsOptional()
  timestamp?: string; // ISO timestamp, defaults to now

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>; // Optional metadata (RSSI, SNR, etc.)
}

/**
 * Batch reading payload for efficiency
 */
export class IngestBatchDto {
  @IsUUID()
  @IsOptional()
  tenantId?: string; // If provided, all readings belong to this tenant

  readings: IngestReadingDto[];
}

/**
 * LoRaWAN-specific payload (ChirpStack format)
 */
export class LoRaWANUplinkDto {
  @IsString()
  @IsNotEmpty()
  devEUI: string;

  @IsString()
  @IsNotEmpty()
  data: string; // Base64 encoded payload

  @IsOptional()
  fPort?: number;

  @IsOptional()
  fCnt?: number;

  @IsObject()
  @IsOptional()
  rxInfo?: Array<{
    gatewayID: string;
    rssi: number;
    snr: number;
  }>;

  @IsObject()
  @IsOptional()
  txInfo?: {
    frequency: number;
    dr: number;
  };
}

/**
 * Sigfox callback payload
 */
export class SigfoxCallbackDto {
  @IsString()
  @IsNotEmpty()
  device: string; // Sigfox device ID

  @IsString()
  @IsNotEmpty()
  data: string; // Hex payload

  @IsOptional()
  time?: number; // Unix timestamp

  @IsOptional()
  seqNumber?: number;

  @IsOptional()
  avgSnr?: number;

  @IsOptional()
  station?: string;

  @IsOptional()
  rssi?: number;
}

