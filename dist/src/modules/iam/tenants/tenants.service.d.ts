import { PrismaService } from '../../../core/prisma/prisma.service';
import { KyselyService } from '../../../core/kysely/kysely.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenant.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { Tenant } from '@prisma/client';
export declare class TenantsService {
    private readonly prisma;
    private readonly kysely;
    private readonly logger;
    constructor(prisma: PrismaService, kysely: KyselyService);
    create(dto: CreateTenantDto, user: AuthenticatedUser): Promise<Tenant>;
    findAll(query: TenantQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Tenant>>;
    getTree(user: AuthenticatedUser): Promise<any[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<Tenant>;
    update(id: string, dto: UpdateTenantDto, user: AuthenticatedUser): Promise<Tenant>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
    getStats(id: string, user: AuthenticatedUser): Promise<{
        tenant: {
            id: any;
            name: any;
            path: any;
        };
        stats: any;
    }>;
    private hasAccessToTenant;
    private sanitizeForLtree;
}
