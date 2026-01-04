// =============================================================================
// Common Interfaces - Refactored for Asset/Device Split
// =============================================================================

import { SystemRole } from '@prisma/client';

// JWT Payload
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  tenantId?: string;
  role?: SystemRole;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

// Authenticated User (attached to request)
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  tenantPath: string;
  role: SystemRole;
  permissions: string[];
}

// Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Reading Job Data - Updated for new device-based flow
export interface ReadingJobData {
  tenantId: string;
  meterId?: string;
  deviceId: string; // The device identifier from payload (e.g., DevEUI)
  internalDeviceId?: string; // Our internal device UUID
  technology: string;
  payload: string;
  timestamp: Date;
  metadata?: IntegrationMetadata;
}

// Decoded Reading Result
export interface DecodedReading {
  value: number;
  consumption?: number;
  batteryLevel?: number;
  signalStrength?: number;
  temperature?: number;
  alarms?: string[];
  unit?: string;
  raw?: Record<string, any>;
}

// Socket Room
export interface SocketRoom {
  tenantId: string;
  userId: string;
}

// Address (shared structure)
export interface Address {
  city?: string;
  district?: string;
  neighborhood?: string;
  street?: string;
  buildingNo?: string;
  floor?: string;
  doorNo?: string;
  postalCode?: string;
  extraDetails?: string;
}

// Communication Technology Field Definition
export interface TechFieldDefinition {
  name: string;
  label: string;
  type: 'hex' | 'string' | 'number';
  length?: number;
  regex?: string;
  required: boolean;
  description?: string;
}

// Device Lookup Result (used in ingestion)
export interface DeviceLookupResult {
  deviceId: string;       // Internal device UUID
  tenantId: string;
  meterId: string | null; // Linked meter UUID (null if not linked)
  deviceProfileId: string;
  decoderFunction: string | null;
}

// Customer Details (Individual)
export interface IndividualCustomerDetails {
  firstName: string;
  lastName: string;
  tcIdNo?: string;
  phone?: string;
  email?: string;
}

// Customer Details (Organizational)
export interface OrganizationalCustomerDetails {
  organizationName: string;
  taxId: string;
  taxOffice?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

// =============================================================================
// Integration Metadata Types
// =============================================================================
// These interfaces define the metadata structure for IoT device data ingestion.
// Integrators can use these types to understand what can be sent.
// Additional fields beyond these are also accepted (extensible).
// =============================================================================

/**
 * Common radio signal metadata present in most IoT technologies
 */
export interface SignalMetadata {
  /** Received Signal Strength Indicator in dBm (e.g., -120 to 0) */
  rssi?: number;
  /** Signal-to-Noise Ratio in dB */
  snr?: number;
  /** Average SNR over multiple transmissions */
  avgSnr?: number;
  /** Signal quality percentage (0-100) */
  signalQuality?: number;
}

/**
 * Gateway/Base station information
 */
export interface GatewayMetadata {
  /** Gateway/Station identifier */
  gatewayId?: string;
  /** Station identifier (Sigfox terminology) */
  station?: string;
  /** Network server identifier */
  networkServer?: string;
}

/**
 * LoRaWAN-specific metadata
 */
export interface LoRaWANMetadata extends SignalMetadata, GatewayMetadata {
  /** Frame port (1-223 for application data) */
  fPort?: number;
  /** Frame counter */
  fCnt?: number;
  /** Transmission frequency in Hz */
  frequency?: number;
  /** Data rate index */
  dr?: number;
  /** Spreading factor (7-12) */
  sf?: number;
  /** Bandwidth in kHz */
  bandwidth?: number;
  /** Coding rate (e.g., "4/5") */
  codingRate?: string;
  /** Whether this is an ADR-enabled transmission */
  adr?: boolean;
}

/**
 * Sigfox-specific metadata
 */
export interface SigfoxMetadata extends SignalMetadata, GatewayMetadata {
  /** Message sequence number */
  seqNumber?: number;
  /** Number of base stations that received the message */
  nbBaseStations?: number;
  /** Computed location (if available) */
  computedLocation?: {
    lat: number;
    lng: number;
    radius?: number;
  };
}

/**
 * NB-IoT specific metadata
 */
export interface NBIoTMetadata extends SignalMetadata {
  /** Cell ID */
  cellId?: string;
  /** Physical Cell ID */
  pci?: number;
  /** Reference Signal Received Power */
  rsrp?: number;
  /** Reference Signal Received Quality */
  rsrq?: number;
  /** Evolved UTRA Cell ID */
  earfcn?: number;
}

/**
 * Integration metadata - main type for ingestion endpoints
 * Contains common fields across all technologies plus extensible properties.
 * 
 * @example
 * // LoRaWAN example
 * const metadata: IntegrationMetadata = {
 *   fPort: 2,
 *   fCnt: 1234,
 *   rssi: -105,
 *   snr: 8.5,
 *   frequency: 868100000,
 *   dr: 5,
 *   gatewayId: 'eui-a840411234567890'
 * };
 * 
 * @example
 * // Sigfox example
 * const metadata: IntegrationMetadata = {
 *   seqNumber: 42,
 *   rssi: -120,
 *   avgSnr: 15.2,
 *   station: 'ABCD'
 * };
 */
export interface IntegrationMetadata extends SignalMetadata, GatewayMetadata {
  // LoRaWAN fields
  /** Frame port (LoRaWAN) */
  fPort?: number;
  /** Frame counter (LoRaWAN) */
  fCnt?: number;
  /** Transmission frequency in Hz */
  frequency?: number;
  /** Data rate index */
  dr?: number;
  /** Spreading factor */
  sf?: number;
  /** Bandwidth in kHz */
  bandwidth?: number;

  // Sigfox fields
  /** Message sequence number (Sigfox) */
  seqNumber?: number;
  /** Number of base stations (Sigfox) */
  nbBaseStations?: number;

  // NB-IoT fields
  /** Cell ID (NB-IoT) */
  cellId?: string;
  /** Reference Signal Received Power (NB-IoT) */
  rsrp?: number;
  /** Reference Signal Received Quality (NB-IoT) */
  rsrq?: number;

  // Device state
  /** Battery level percentage (0-100) */
  batteryLevel?: number;
  /** Battery voltage in V */
  batteryVoltage?: number;
  /** Device temperature in Celsius */
  temperature?: number;

  // Location (if device reports location)
  /** Latitude */
  lat?: number;
  /** Longitude */
  lng?: number;
  /** Location accuracy in meters */
  accuracy?: number;

  // Extensible - any additional fields from integrations
  [key: string]: unknown;
}
