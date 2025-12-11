import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceQueryDto, BulkCreateDeviceDto } from './dto/device.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { Device } from '@prisma/client';
export declare class DevicesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateDeviceDto, user: AuthenticatedUser): Promise<Device>;
    bulkCreate(dto: BulkCreateDeviceDto, user: AuthenticatedUser): Promise<{
        created: number;
        errors: string[];
    }>;
    findAll(query: DeviceQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Device>>;
    findAvailable(tenantId: string, meterProfileId: string, user: AuthenticatedUser): Promise<Device[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<Device & {
        linkedMeter?: any;
    }>;
    findByDynamicField(fieldName: string, fieldValue: string): Promise<Device | null>;
    update(id: string, dto: UpdateDeviceDto, user: AuthenticatedUser): Promise<Device>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
    private validateDynamicFields;
}
