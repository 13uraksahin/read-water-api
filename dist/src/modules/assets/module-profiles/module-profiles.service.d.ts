import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { CreateModuleProfileDto, UpdateModuleProfileDto, ModuleProfileQueryDto } from './dto/module-profile.dto';
import { PaginatedResult } from '../../../common/interfaces';
import { DeviceProfile } from '@prisma/client';
type ModuleProfile = DeviceProfile;
export declare class ModuleProfilesService {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService);
    create(dto: CreateModuleProfileDto): Promise<ModuleProfile>;
    findAll(query: ModuleProfileQueryDto): Promise<PaginatedResult<ModuleProfile>>;
    findOne(id: string): Promise<ModuleProfile>;
    update(id: string, dto: UpdateModuleProfileDto): Promise<ModuleProfile>;
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
    getDecoder(moduleProfileId: string): Promise<DecoderData | null>;
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
    moduleProfileId: string;
    moduleProfile: {
        id: string;
        brand: string;
        modelCode: string;
    };
}
export { ModuleProfilesService as DeviceProfilesService };
