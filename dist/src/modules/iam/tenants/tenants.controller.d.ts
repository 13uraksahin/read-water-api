import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto/tenant.dto';
import type { AuthenticatedUser } from '../../../common/interfaces';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    create(dto: CreateTenantDto, user: AuthenticatedUser): Promise<Tenant>;
    findAll(query: TenantQueryDto, user: AuthenticatedUser): Promise<import("../../../common/interfaces").PaginatedResult<Tenant>>;
    getTree(user: AuthenticatedUser): Promise<any[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<Tenant>;
    getStats(id: string, user: AuthenticatedUser): Promise<{
        tenant: {
            id: any;
            name: any;
            path: any;
        };
        stats: any;
    }>;
    update(id: string, dto: UpdateTenantDto, user: AuthenticatedUser): Promise<Tenant>;
    patch(id: string, dto: UpdateTenantDto, user: AuthenticatedUser): Promise<Tenant>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
}
