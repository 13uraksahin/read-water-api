import { DeviceStatus, CommunicationTechnology } from '@prisma/client';
export { DeviceStatus as ModuleStatus } from '@prisma/client';
export declare class CreateModuleDto {
    tenantId: string;
    moduleProfileId: string;
    serialNumber: string;
    status?: DeviceStatus;
    selectedTechnology?: CommunicationTechnology;
    activeScenarioIds?: string[];
    dynamicFields: Record<string, string>;
    metadata?: Record<string, any>;
}
export declare class UpdateModuleDto {
    status?: DeviceStatus;
    selectedTechnology?: CommunicationTechnology;
    activeScenarioIds?: string[];
    dynamicFields?: Record<string, string>;
    lastSignalStrength?: number;
    lastBatteryLevel?: number;
    metadata?: Record<string, any>;
}
export declare class ModuleQueryDto {
    page?: number;
    limit?: number;
    tenantId?: string;
    moduleProfileId?: string;
    status?: DeviceStatus;
    brand?: string;
    technology?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class BulkCreateModuleDto {
    tenantId: string;
    moduleProfileId: string;
    modules: Array<{
        serialNumber: string;
        dynamicFields: Record<string, string>;
        metadata?: Record<string, any>;
    }>;
}
export declare class BulkImportModuleRowDto {
    serialNumber: string;
    [key: string]: string;
}
export declare class BulkImportModulesDto {
    rows: Record<string, string>[];
    namePrefix?: string;
    nameSuffix?: string;
    moduleProfileId: string;
}
export declare class ExportModulesQueryDto extends ModuleQueryDto {
    limit?: number;
}
export { CreateModuleDto as CreateDeviceDto, UpdateModuleDto as UpdateDeviceDto, ModuleQueryDto as DeviceQueryDto, BulkCreateModuleDto as BulkCreateDeviceDto, };
