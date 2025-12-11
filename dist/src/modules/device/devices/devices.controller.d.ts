import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceQueryDto, BulkCreateDeviceDto } from './dto/device.dto';
import type { AuthenticatedUser } from '../../../common/interfaces';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    create(dto: CreateDeviceDto, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tenantId: string;
        serialNumber: string;
        deviceProfileId: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
    }>;
    bulkCreate(dto: BulkCreateDeviceDto, user: AuthenticatedUser): Promise<{
        created: number;
        errors: string[];
    }>;
    findAll(query: DeviceQueryDto, user: AuthenticatedUser): Promise<import("../../../common/interfaces").PaginatedResult<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tenantId: string;
        serialNumber: string;
        deviceProfileId: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
    }>>;
    findAvailable(tenantId: string, meterProfileId: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tenantId: string;
        serialNumber: string;
        deviceProfileId: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
    }[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tenantId: string;
        serialNumber: string;
        deviceProfileId: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
    } & {
        linkedMeter?: any;
    }>;
    update(id: string, dto: UpdateDeviceDto, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        tenantId: string;
        serialNumber: string;
        deviceProfileId: string;
        status: import("@prisma/client").$Enums.DeviceStatus;
        dynamicFields: import("@prisma/client/runtime/library").JsonValue;
        lastSignalStrength: number | null;
        lastBatteryLevel: number | null;
        lastCommunicationAt: Date | null;
    }>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
}
