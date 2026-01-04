import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateModuleDto, UpdateModuleDto, ModuleQueryDto, BulkCreateModuleDto } from './dto/module.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { Device } from '@prisma/client';
type Module = Device;
export declare class ModulesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private hasUserAccessToTenant;
    create(dto: CreateModuleDto, user: AuthenticatedUser): Promise<Module>;
    bulkCreate(dto: BulkCreateModuleDto, user: AuthenticatedUser): Promise<{
        created: number;
        errors: string[];
    }>;
    private getEffectiveTenantPath;
    findAll(query: ModuleQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Module>>;
    findAvailable(tenantId: string, meterProfileId: string, user: AuthenticatedUser): Promise<Module[]>;
    findOne(id: string, user: AuthenticatedUser): Promise<Module & {
        meter?: any;
    }>;
    findByDynamicField(fieldName: string, fieldValue: string): Promise<Module | null>;
    update(id: string, dto: UpdateModuleDto, user: AuthenticatedUser): Promise<Module>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
    private validateTechnologyAndScenarios;
    private validateDynamicFields;
}
export { ModulesService as DevicesService };
