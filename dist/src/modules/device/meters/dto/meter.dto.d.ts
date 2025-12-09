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
declare class ConnectivityFieldsDto {
    technology: string;
    fields: Record<string, string>;
}
declare class ConnectivityConfigDto {
    primary?: ConnectivityFieldsDto;
    secondary?: ConnectivityFieldsDto;
    others?: ConnectivityFieldsDto[];
}
export declare class CreateMeterDto {
    tenantId: string;
    customerId?: string;
    meterProfileId: string;
    serialNumber: string;
    initialIndex?: number;
    installationDate: string;
    status?: MeterStatus;
    connectivityConfig?: ConnectivityConfigDto;
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
    connectivityConfig?: ConnectivityConfigDto;
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
export {};
