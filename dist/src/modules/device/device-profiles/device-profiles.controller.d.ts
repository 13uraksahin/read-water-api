import { DeviceProfilesService, DecoderData } from './device-profiles.service';
import { CreateDeviceProfileDto, UpdateDeviceProfileDto, DeviceProfileQueryDto } from './dto/device-profile.dto';
export declare class DeviceProfilesController {
    private readonly deviceProfilesService;
    constructor(deviceProfilesService: DeviceProfilesService);
    create(dto: CreateDeviceProfileDto): Promise<DeviceProfile>;
    findAll(query: DeviceProfileQueryDto): Promise<import("../../../common/interfaces").PaginatedResult<DeviceProfile>>;
    findOne(id: string): Promise<DeviceProfile>;
    update(id: string, dto: UpdateDeviceProfileDto): Promise<DeviceProfile>;
    patch(id: string, dto: UpdateDeviceProfileDto): Promise<DeviceProfile>;
    delete(id: string): Promise<void>;
    testDecoder(id: string, payload?: string): Promise<{
        success: boolean;
        output?: any;
        error?: string;
    }>;
}
export declare class DecodersController {
    private readonly deviceProfilesService;
    constructor(deviceProfilesService: DeviceProfilesService);
    getDecoders(page?: string, limit?: string, technology?: string, brand?: string): Promise<{
        data: DecoderData[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getDecoder(id: string): Promise<DecoderData | null>;
}
