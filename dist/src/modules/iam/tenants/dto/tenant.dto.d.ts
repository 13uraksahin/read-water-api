import { TenantSubscriptionStatus } from '@prisma/client';
declare class AddressDto {
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
export declare class CreateTenantDto {
    name: string;
    parentId?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactPhone?: string;
    contactEmail?: string;
    taxId?: string;
    taxOffice?: string;
    address?: AddressDto;
    latitude?: number;
    longitude?: number;
    tenantSubscriptionStatus?: TenantSubscriptionStatus;
    subscriptionPlan?: string;
    settings?: Record<string, any>;
    allowedProfileIds?: string[];
    allowedDeviceProfileIds?: string[];
}
export declare class UpdateTenantDto {
    name?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactPhone?: string;
    contactEmail?: string;
    taxId?: string;
    taxOffice?: string;
    address?: AddressDto;
    latitude?: number;
    longitude?: number;
    tenantSubscriptionStatus?: TenantSubscriptionStatus;
    subscriptionPlan?: string;
    settings?: Record<string, any>;
    allowedProfileIds?: string[];
    allowedDeviceProfileIds?: string[];
}
export declare class TenantQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    tenantSubscriptionStatus?: TenantSubscriptionStatus;
    parentId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export {};
