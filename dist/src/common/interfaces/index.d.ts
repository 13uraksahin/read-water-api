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
    technology: string;
    payload: string;
    timestamp: Date;
    metadata?: Record<string, any>;
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
export interface ConnectivityConfig {
    primary?: {
        technology: string;
        fields: Record<string, string>;
    };
    secondary?: {
        technology: string;
        fields: Record<string, string>;
    };
    others?: Array<{
        technology: string;
        fields: Record<string, string>;
    }>;
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
