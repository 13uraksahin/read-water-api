import { ModulesService } from './modules.service';
import { CreateModuleDto, UpdateModuleDto, ModuleQueryDto, BulkCreateModuleDto, BulkImportModulesDto, ExportModulesQueryDto } from './dto/module.dto';
import type { AuthenticatedUser } from '../../../common/interfaces';
export declare class ModulesController {
    private readonly modulesService;
    constructor(modulesService: ModulesService);
    create(dto: CreateModuleDto, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        deviceProfileId: string;
        serialNumber: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        selectedTechnology: import("@prisma/client").$Enums.CommunicationTechnology | null;
        activeScenarioIds: string[];
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    bulkCreate(dto: BulkCreateModuleDto, user: AuthenticatedUser): Promise<{
        created: number;
        errors: string[];
    }>;
    findAll(query: ModuleQueryDto, user: AuthenticatedUser): Promise<import("../../../common/interfaces").PaginatedResult<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        deviceProfileId: string;
        serialNumber: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        selectedTechnology: import("@prisma/client").$Enums.CommunicationTechnology | null;
        activeScenarioIds: string[];
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>>;
    findAvailable(tenantId: string, meterProfileId: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        deviceProfileId: string;
        serialNumber: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        selectedTechnology: import("@prisma/client").$Enums.CommunicationTechnology | null;
        activeScenarioIds: string[];
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    exportModules(query: ExportModulesQueryDto, user: AuthenticatedUser): Promise<import("../../../common/interfaces").PaginatedResult<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        deviceProfileId: string;
        serialNumber: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        selectedTechnology: import("@prisma/client").$Enums.CommunicationTechnology | null;
        activeScenarioIds: string[];
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>>;
    bulkImport(dto: BulkImportModulesDto, user: AuthenticatedUser): Promise<{
        success: boolean;
        totalRows: number;
        importedRows: number;
        failedRows: number;
        errors: Array<{
            row: number;
            field: string;
            message: string;
        }>;
    }>;
    findOne(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        deviceProfileId: string;
        serialNumber: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        selectedTechnology: import("@prisma/client").$Enums.CommunicationTechnology | null;
        activeScenarioIds: string[];
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    } & {
        meter?: any;
    }>;
    update(id: string, dto: UpdateModuleDto, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        deviceProfileId: string;
        serialNumber: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        selectedTechnology: import("@prisma/client").$Enums.CommunicationTechnology | null;
        activeScenarioIds: string[];
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    patch(id: string, dto: UpdateModuleDto, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        deviceProfileId: string;
        serialNumber: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        selectedTechnology: import("@prisma/client").$Enums.CommunicationTechnology | null;
        activeScenarioIds: string[];
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
}
export { ModulesController as DevicesController };
