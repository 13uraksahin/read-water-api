import { PrismaService } from '../../../core/prisma/prisma.service';
import { KyselyService } from '../../../core/kysely/kysely.service';
import { CreateMeterDto, UpdateMeterDto, MeterQueryDto, ControlValveDto, LinkDeviceDto, UnlinkDeviceDto, LinkSubscriptionDto, BulkImportMetersDto, ExportQueryDto } from './dto/meter.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { Meter } from '@prisma/client';
export declare class MetersService {
    private readonly prisma;
    private readonly kysely;
    private readonly logger;
    constructor(prisma: PrismaService, kysely: KyselyService);
    private hasUserAccessToTenant;
    create(dto: CreateMeterDto, user: AuthenticatedUser): Promise<Meter>;
    private getEffectiveTenantPath;
    findAll(query: MeterQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Meter>>;
    findOne(id: string, user: AuthenticatedUser): Promise<Meter>;
    update(id: string, dto: UpdateMeterDto, user: AuthenticatedUser): Promise<Meter>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
    linkSubscription(meterId: string, dto: LinkSubscriptionDto, user: AuthenticatedUser): Promise<Meter>;
    unlinkSubscription(meterId: string, user: AuthenticatedUser): Promise<Meter>;
    linkDevice(meterId: string, dto: LinkDeviceDto, user: AuthenticatedUser): Promise<Meter>;
    unlinkDevice(meterId: string, dto: UnlinkDeviceDto, user: AuthenticatedUser): Promise<Meter>;
    controlValve(id: string, dto: ControlValveDto, user: AuthenticatedUser): Promise<Meter>;
    getReadingHistory(id: string, user: AuthenticatedUser, days?: number): Promise<{
        bucket: Date;
        total_consumption: number;
        avg_consumption: number;
        reading_count: number;
    }[]>;
    exportMeters(query: ExportQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Meter>>;
    bulkImport(dto: BulkImportMetersDto, user: AuthenticatedUser): Promise<{
        success: boolean;
        totalRows: number;
        importedRows: number;
        failedRows: number;
        errors: Array<{
            row: number;
            field: string;
            message: string;
        }>;
    }>;
}
