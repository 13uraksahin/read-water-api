import { SystemRole } from '@prisma/client';
export interface JwtPayload {
    sub: string;
    email: string;
    tenantId?: string;
    role?: SystemRole;
    permissions?: string[];
    iat?: number;
    exp?: number;
}
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
export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}
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
export interface ReadingJobData {
    tenantId: string;
    meterId?: string;
    deviceId: string;
    internalDeviceId?: string;
    technology: string;
    payload: string;
    timestamp: Date;
    metadata?: IntegrationMetadata;
}
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
export interface SocketRoom {
    tenantId: string;
    userId: string;
}
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
export interface TechFieldDefinition {
    name: string;
    label: string;
    type: 'hex' | 'string' | 'number';
    length?: number;
    regex?: string;
    required: boolean;
    description?: string;
}
export interface DeviceLookupResult {
    deviceId: string;
    tenantId: string;
    meterId: string | null;
    deviceProfileId: string;
    decoderFunction: string | null;
}
export interface IndividualCustomerDetails {
    firstName: string;
    lastName: string;
    tcIdNo?: string;
    phone?: string;
    email?: string;
}
export interface OrganizationalCustomerDetails {
    organizationName: string;
    taxId: string;
    taxOffice?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactPhone?: string;
    contactEmail?: string;
}
export interface SignalMetadata {
    rssi?: number;
    snr?: number;
    avgSnr?: number;
    signalQuality?: number;
}
export interface GatewayMetadata {
    gatewayId?: string;
    station?: string;
    networkServer?: string;
}
export interface LoRaWANMetadata extends SignalMetadata, GatewayMetadata {
    fPort?: number;
    fCnt?: number;
    frequency?: number;
    dr?: number;
    sf?: number;
    bandwidth?: number;
    codingRate?: string;
    adr?: boolean;
}
export interface SigfoxMetadata extends SignalMetadata, GatewayMetadata {
    seqNumber?: number;
    nbBaseStations?: number;
    computedLocation?: {
        lat: number;
        lng: number;
        radius?: number;
    };
}
export interface NBIoTMetadata extends SignalMetadata {
    cellId?: string;
    pci?: number;
    rsrp?: number;
    rsrq?: number;
    earfcn?: number;
}
export interface IntegrationMetadata extends SignalMetadata, GatewayMetadata {
    fPort?: number;
    fCnt?: number;
    frequency?: number;
    dr?: number;
    sf?: number;
    bandwidth?: number;
    seqNumber?: number;
    nbBaseStations?: number;
    cellId?: string;
    rsrp?: number;
    rsrq?: number;
    batteryLevel?: number;
    batteryVoltage?: number;
    temperature?: number;
    lat?: number;
    lng?: number;
    accuracy?: number;
    [key: string]: unknown;
}
