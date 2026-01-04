import { MeterStatus, ValveStatus } from '@prisma/client';
export declare class CreateMeterDto {
    tenantId: string;
    meterProfileId: string;
    subscriptionId?: string;
    serialNumber: string;
    initialIndex?: number;
    installationDate: string;
    status?: MeterStatus;
    metadata?: Record<string, any>;
}
export declare class UpdateMeterDto {
    subscriptionId?: string;
    meterProfileId?: string;
    serialNumber?: string;
    status?: MeterStatus;
    valveStatus?: ValveStatus;
    metadata?: Record<string, any>;
}
export declare class MeterQueryDto {
    page?: number;
    limit?: number;
    tenantId?: string;
    subscriptionId?: string;
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
    moduleId: string;
}
export declare class UnlinkDeviceDto {
    moduleStatus?: 'WAREHOUSE' | 'MAINTENANCE';
}
export declare class LinkSubscriptionDto {
    subscriptionId: string;
}
export declare class BulkImportMeterRowDto {
    serialNumber: string;
    initialIndex?: number;
    installationDate?: string;
    status?: MeterStatus;
}
export declare class BulkImportMetersDto {
    rows: BulkImportMeterRowDto[];
    namePrefix?: string;
    nameSuffix?: string;
    meterProfileId: string;
}
export declare class ExportQueryDto extends MeterQueryDto {
    limit?: number;
}
