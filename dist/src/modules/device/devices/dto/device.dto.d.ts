import { DeviceStatus, CommunicationTechnology } from '@prisma/client';
export declare class CreateDeviceDto {
    tenantId: string;
    deviceProfileId: string;
    serialNumber: string;
    status?: DeviceStatus;
    selectedTechnology?: CommunicationTechnology;
    activeScenarioIds?: string[];
    dynamicFields: Record<string, string>;
    metadata?: Record<string, any>;
}
export declare class UpdateDeviceDto {
    status?: DeviceStatus;
    selectedTechnology?: CommunicationTechnology;
    activeScenarioIds?: string[];
    dynamicFields?: Record<string, string>;
    lastSignalStrength?: number;
    lastBatteryLevel?: number;
    metadata?: Record<string, any>;
}
export declare class DeviceQueryDto {
    page?: number;
    limit?: number;
    tenantId?: string;
    deviceProfileId?: string;
    status?: DeviceStatus;
    brand?: string;
    technology?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class BulkCreateDeviceDto {
    tenantId: string;
    deviceProfileId: string;
    devices: Array<{
        serialNumber: string;
        dynamicFields: Record<string, string>;
        metadata?: Record<string, any>;
    }>;
}
