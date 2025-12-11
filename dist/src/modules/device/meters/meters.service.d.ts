import { PrismaService } from '../../../core/prisma/prisma.service';
import { KyselyService } from '../../../core/kysely/kysely.service';
import { CreateMeterDto, UpdateMeterDto, MeterQueryDto, ControlValveDto, LinkDeviceDto, UnlinkDeviceDto } from './dto/meter.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { Meter } from '@prisma/client';
export declare class MetersService {
    private readonly prisma;
    private readonly kysely;
    private readonly logger;
    constructor(prisma: PrismaService, kysely: KyselyService);
    create(dto: CreateMeterDto, user: AuthenticatedUser): Promise<Meter>;
    findAll(query: MeterQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Meter>>;
    findOne(id: string, user: AuthenticatedUser): Promise<Meter>;
    update(id: string, dto: UpdateMeterDto, user: AuthenticatedUser): Promise<Meter>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
    linkDevice(meterId: string, dto: LinkDeviceDto, user: AuthenticatedUser): Promise<Meter>;
    unlinkDevice(meterId: string, dto: UnlinkDeviceDto, user: AuthenticatedUser): Promise<Meter>;
    controlValve(id: string, dto: ControlValveDto, user: AuthenticatedUser): Promise<Meter>;
    getReadingHistory(id: string, user: AuthenticatedUser, days?: number): Promise<{
        bucket: Date;
        total_consumption: number;
        avg_consumption: number;
        reading_count: number;
    }[]>;
}
