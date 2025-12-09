import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { CreateMeterProfileDto, UpdateMeterProfileDto, ProfileQueryDto } from './dto/profile.dto';
import { PaginatedResult } from '../../../common/interfaces';
import { MeterProfile } from '@prisma/client';
export declare class ProfilesService {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService);
    create(dto: CreateMeterProfileDto): Promise<MeterProfile>;
    findAll(query: ProfileQueryDto): Promise<PaginatedResult<MeterProfile>>;
    findOne(id: string): Promise<MeterProfile>;
    update(id: string, dto: UpdateMeterProfileDto): Promise<MeterProfile>;
    delete(id: string): Promise<void>;
    getCommunicationTechFields(): Promise<{
        id: string;
        technology: import("@prisma/client").$Enums.CommunicationTechnology;
        createdAt: Date;
        updatedAt: Date;
        fields: import("@prisma/client/runtime/library").JsonValue;
        integrationTypes: import("@prisma/client").$Enums.IntegrationType[];
    }[]>;
}
