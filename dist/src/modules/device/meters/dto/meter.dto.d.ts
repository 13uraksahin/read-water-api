import { MeterStatus, ValveStatus } from '@prisma/client';
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
export declare class CreateMeterDto {
    tenantId: string;
    customerId: string;
    meterProfileId: string;
    serialNumber: string;
    initialIndex?: number;
    installationDate: string;
    status?: MeterStatus;
    address: AddressDto;
    addressCode?: string;
    latitude?: number;
    longitude?: number;
    metadata?: Record<string, any>;
}
export declare class UpdateMeterDto {
    customerId?: string;
    meterProfileId?: string;
    serialNumber?: string;
    status?: MeterStatus;
    valveStatus?: ValveStatus;
    address?: AddressDto;
    addressCode?: string;
    latitude?: number;
    longitude?: number;
    metadata?: Record<string, any>;
}
export declare class MeterQueryDto {
    page?: number;
    limit?: number;
    tenantId?: string;
    customerId?: string;
    status?: MeterStatus;
    brand?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class ControlValveDto {
    action: 'OPEN' | 'CLOSED';
}
export declare class LinkDeviceDto {
    deviceId: string;
}
export declare class UnlinkDeviceDto {
    deviceStatus?: 'WAREHOUSE' | 'MAINTENANCE';
}
export {};
