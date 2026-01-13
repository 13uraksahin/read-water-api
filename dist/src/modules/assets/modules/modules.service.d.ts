import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateModuleDto, UpdateModuleDto, ModuleQueryDto, BulkCreateModuleDto, BulkImportModulesDto, ExportModulesQueryDto } from './dto/module.dto';
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
    private transformModuleResponse;
    findByDynamicField(fieldName: string, fieldValue: string): Promise<Module | null>;
    update(id: string, dto: UpdateModuleDto, user: AuthenticatedUser): Promise<Module>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
    private validateTechnologyAndScenarios;
    private validateDynamicFields;
    exportModules(query: ExportModulesQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Module>>;
    bulkImport(dto: BulkImportModulesDto, user: AuthenticatedUser): Promise<{
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
export { ModulesService as DevicesService };
