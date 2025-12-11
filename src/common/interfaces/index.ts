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
  metadata?: Record<string, any>;
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
