import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { CreateMeterProfileDto, UpdateMeterProfileDto, MeterProfileQueryDto } from './dto/meter-profile.dto';
import { PaginatedResult } from '../../../common/interfaces';
import { MeterProfile } from '@prisma/client';
export declare class MeterProfilesService {
    private readonly prisma;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, redisService: RedisService);
    create(dto: CreateMeterProfileDto): Promise<MeterProfile>;
    findAll(query: MeterProfileQueryDto): Promise<PaginatedResult<MeterProfile>>;
    findOne(id: string): Promise<MeterProfile>;
    update(id: string, dto: UpdateMeterProfileDto): Promise<MeterProfile>;
    delete(id: string): Promise<void>;
    getCommunicationTechFields(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        technology: import("@prisma/client").$Enums.CommunicationTechnology;
        fields: import("@prisma/client/runtime/library").JsonValue;
        integrationTypes: import("@prisma/client").$Enums.IntegrationType[];
    }[]>;
    getDeviceProfiles(): Promise<{
        id: string;
        brand: import("@prisma/client").$Enums.DeviceBrand;
        modelCode: string;
        communicationTechnology: import("@prisma/client").$Enums.CommunicationTechnology;
        batteryLifeMonths: number | null;
    }[]>;
}
