// =============================================================================
// Ingestion DTOs
// =============================================================================
// DTOs for IoT device data ingestion with multi-format time support.
// =============================================================================

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsObject,
  ValidateNested,
  IsArray,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CommunicationTechnology } from '@prisma/client';
import type { IntegrationMetadata } from '../../../common/interfaces';
import { toISOString, detectTimeFormat } from '../../../common/utils';

// =============================================================================
// Custom Validators
// =============================================================================

/**
 * Custom validator for time fields that accepts multiple formats:
 * - ISO 8601 strings: "2025-01-15T10:30:00Z"
 * - Unix timestamp in seconds (epoch): 1736936400
 * - Unix timestamp in milliseconds: 1736936400000
 * - Numeric strings: "1736936400"
 */
export function IsValidTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTime',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          `${propertyName} must be a valid time value. ` +
          'Supported formats: ISO 8601 string (e.g., "2025-01-15T10:30:00Z"), ' +
          'epoch seconds (e.g., 1736936400), or epoch milliseconds (e.g., 1736936400000)',
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (value === undefined || value === null) {
            return true; // Optional field
          }
          const format = detectTimeFormat(value);
          if (format === null) {
            return false;
          }
          const isoString = toISOString(value);
          return isoString !== null;
        },
      },
    });
  };
}

/**
 * Transform time value to ISO 8601 string
 * Handles epoch seconds, milliseconds, and ISO strings
 */
export function TransformToISOString() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const isoString = toISOString(value);
    return isoString ?? value;
  });
}

// =============================================================================
// Main DTOs
// =============================================================================

/**
 * Raw reading payload from IoT devices
 * This DTO is minimal for high-performance intake
 * 
 * @example
 * // LoRaWAN example
 * {
 *   "device": "70B3D5499ABCDEF0",
 *   "payload": "0102030405060708",
 *   "technology": "LORAWAN",
 *   "time": "2025-01-15T10:30:00Z",
 *   "metadata": {
 *     "fPort": 2,
 *     "rssi": -105,
 *     "snr": 8.5
 *   }
 * }
 * 
 * @example
 * // Sigfox example with epoch seconds
 * {
 *   "device": "ABCD1234",
 *   "payload": "0102030405",
 *   "technology": "SIGFOX",
 *   "time": 1736936400,
 *   "metadata": {
 *     "seqNumber": 42,
 *     "rssi": -120
 *   }
 * }
 */
export class IngestReadingDto {
  /**
   * Device identifier (DevEUI, Sigfox ID, IMEI, etc.)
   * Case-insensitive - will be normalized to lowercase internally
   */
  @IsString()
  @IsNotEmpty()
  device: string;

  /**
   * Raw hex payload from device
   */
  @IsString()
  @IsNotEmpty()
  payload: string;

  /**
   * Communication technology used by the device
   */
  @IsEnum(CommunicationTechnology)
  @IsNotEmpty()
  technology: CommunicationTechnology;

  /**
   * Timestamp of the reading
   * Accepts multiple formats:
   * - ISO 8601 string: "2025-01-15T10:30:00Z"
   * - Epoch seconds: 1736936400
   * - Epoch milliseconds: 1736936400000
   * Defaults to current time if not provided
   */
  @IsOptional()
  @IsValidTime()
  @TransformToISOString()
  time?: string | number;

  /**
   * Optional metadata from the integration (RSSI, SNR, fPort, etc.)
   * See IntegrationMetadata interface for common fields.
   * Additional custom fields are also accepted.
   */
  @IsObject()
  @IsOptional()
  metadata?: IntegrationMetadata;
}

/**
 * Batch reading payload for efficiency
 * Use this endpoint for uploading multiple readings at once
 * 
 * @example
 * {
 *   "readings": [
 *     {
 *       "device": "70B3D5499ABCDEF0",
 *       "payload": "0102030405",
 *       "technology": "LORAWAN",
 *       "time": 1736936400
 *     },
 *     {
 *       "device": "70B3D5499ABCDEF1",
 *       "payload": "0A0B0C0D0E",
 *       "technology": "LORAWAN",
 *       "time": "2025-01-15T10:30:00Z"
 *     }
 *   ]
 * }
 */
export class IngestBatchDto {
  /**
   * Optional tenant ID - if provided, all readings belong to this tenant.
   * If not provided, tenant is determined from each device's registration.
   */
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  /**
   * Array of readings to ingest
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngestReadingDto)
  readings: IngestReadingDto[];
}

// =============================================================================
// Technology-Specific DTOs (Native Webhook Formats)
// =============================================================================

/**
 * LoRaWAN-specific payload (ChirpStack/TTN compatible)
 * This endpoint accepts the native webhook format from LoRaWAN network servers
 * 
 * @example
 * // ChirpStack uplink format
 * {
 *   "devEUI": "70B3D5499ABCDEF0",
 *   "data": "AQIDBAUGBwg=",  // Base64 encoded
 *   "fPort": 2,
 *   "fCnt": 1234,
 *   "rxInfo": [{
 *     "gatewayID": "eui-a840411234567890",
 *     "rssi": -105,
 *     "snr": 8.5
 *   }],
 *   "txInfo": {
 *     "frequency": 868100000,
 *     "dr": 5
 *   }
 * }
 */
export class LoRaWANUplinkDto {
  /**
   * Device EUI (8 bytes hex)
   */
  @IsString()
  @IsNotEmpty()
  devEUI: string;

  /**
   * Base64 encoded payload
   */
  @IsString()
  @IsNotEmpty()
  data: string;

  /**
   * Frame port
   */
  @IsOptional()
  fPort?: number;

  /**
   * Frame counter
   */
  @IsOptional()
  fCnt?: number;

  /**
   * Reception info from gateways
   */
  @IsObject()
  @IsOptional()
  rxInfo?: Array<{
    gatewayID: string;
    rssi: number;
    snr: number;
  }>;

  /**
   * Transmission info
   */
  @IsObject()
  @IsOptional()
  txInfo?: {
    frequency: number;
    dr: number;
  };
}

/**
 * Sigfox callback payload
 * This endpoint accepts the native callback format from Sigfox backend
 * 
 * @example
 * // Sigfox callback format
 * {
 *   "device": "ABCD1234",
 *   "data": "0102030405",
 *   "time": 1736936400,        // Epoch seconds
 *   "seqNumber": 42,
 *   "avgSnr": 15.2,
 *   "station": "ABCD",
 *   "rssi": -120
 * }
 */
export class SigfoxCallbackDto {
  /**
   * Sigfox device ID (8 hex characters)
   */
  @IsString()
  @IsNotEmpty()
  device: string;

  /**
   * Hex payload
   */
  @IsString()
  @IsNotEmpty()
  data: string;

  /**
   * Unix timestamp in seconds (epoch seconds)
   * Sigfox always sends time as integer epoch seconds
   */
  @IsOptional()
  time?: number;

  /**
   * Message sequence number
   */
  @IsOptional()
  seqNumber?: number;

  /**
   * Average Signal-to-Noise Ratio
   */
  @IsOptional()
  avgSnr?: number;

  /**
   * Base station identifier
   */
  @IsOptional()
  station?: string;

  /**
   * Received Signal Strength Indicator
   */
  @IsOptional()
  rssi?: number;
}
