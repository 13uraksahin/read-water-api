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
    getDecoders(params: {
        page?: number;
        limit?: number;
        technology?: string;
        brand?: string;
    }): Promise<{
        data: DecoderData[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getDecoder(deviceProfileId: string): Promise<DecoderData | null>;
}
export interface DecoderData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
    technology: string;
    functionCode: string;
    testPayload: string | null;
    expectedOutput: Record<string, unknown> | null;
    lastTestedAt: Date | null;
    lastTestSucceeded: boolean | null;
    deviceProfileId: string;
    deviceProfile: {
        id: string;
        brand: string;
        modelCode: string;
    };
}
