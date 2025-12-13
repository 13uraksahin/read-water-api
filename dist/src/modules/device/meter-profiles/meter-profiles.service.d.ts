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
    getCommunicationTechFields(): Promise<any>;
    getDeviceProfiles(): Promise<any>;
}
