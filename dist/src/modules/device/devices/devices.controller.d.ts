import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceQueryDto, BulkCreateDeviceDto } from './dto/device.dto';
import type { AuthenticatedUser } from '../../../common/interfaces';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    create(dto: CreateDeviceDto, user: AuthenticatedUser): Promise<Device>;
    bulkCreate(dto: BulkCreateDeviceDto, user: AuthenticatedUser): Promise<{
        created: number;
        errors: string[];
    }>;
    findAll(query: DeviceQueryDto, user: AuthenticatedUser): Promise<import("../../../common/interfaces").PaginatedResult<Device>>;
    findAvailable(tenantId: string, meterProfileId: string, user: AuthenticatedUser): Promise<Device[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<any>;
    update(id: string, dto: UpdateDeviceDto, user: AuthenticatedUser): Promise<Device>;
    patch(id: string, dto: UpdateDeviceDto, user: AuthenticatedUser): Promise<Device>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
}
