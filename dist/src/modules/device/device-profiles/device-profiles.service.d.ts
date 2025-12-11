import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { CreateDeviceProfileDto, UpdateDeviceProfileDto, DeviceProfileQueryDto } from './dto/device-profile.dto';
import { PaginatedResult } from '../../../common/interfaces';
import { DeviceProfile } from '@prisma/client';
export declare class DeviceProfilesService {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService);
    create(dto: CreateDeviceProfileDto): Promise<DeviceProfile>;
    findAll(query: DeviceProfileQueryDto): Promise<PaginatedResult<DeviceProfile>>;
    findOne(id: string): Promise<DeviceProfile>;
    update(id: string, dto: UpdateDeviceProfileDto): Promise<DeviceProfile>;
    delete(id: string): Promise<void>;
    testDecoder(id: string, payload?: string): Promise<{
        success: boolean;
        output?: any;
        error?: string;
    }>;
}
