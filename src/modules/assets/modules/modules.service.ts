// =============================================================================
// Modules Service - Communication Modules Management
// =============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateModuleDto,
  UpdateModuleDto,
  ModuleQueryDto,
  BulkCreateModuleDto,
  BulkImportModulesDto,
  ExportModulesQueryDto,
} from './dto/module.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { PAGINATION, SYSTEM_ROLES } from '../../../common/constants';
import { Device, DeviceStatus, CommunicationTechnology } from '@prisma/client';

// Type alias for clarity - Prisma model is "Device" but we expose as "Module"
type Module = Device;

@Injectable()
export class ModulesService {
  private readonly logger = new Logger(ModulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user has access to a specific tenant
   * Supports both hierarchical access AND direct tenant assignments for multi-tenant users
   */
  private async hasUserAccessToTenant(user: AuthenticatedUser, tenantPath: string, tenantId: string): Promise<boolean> {
    // Platform admin can access everything
    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      return true;
    }

    // Check hierarchical access (tenant is descendant or ancestor)
    if (tenantPath.startsWith(user.tenantPath) || user.tenantPath.startsWith(tenantPath)) {
      return true;
    }

    // Check for direct tenant assignment
    const directAssignment = await this.prisma.userTenant.findFirst({
      where: {
        userId: user.id,
        tenantId: tenantId,
      },
    });

    return !!directAssignment;
  }

  /**
   * Create a new module (communication unit)
   */
  async create(dto: CreateModuleDto, user: AuthenticatedUser): Promise<Module> {
    // Verify tenant access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check tenant access (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Verify module profile exists
    const moduleProfile = await this.prisma.deviceProfile.findUnique({
      where: { id: dto.moduleProfileId },
    });

    if (!moduleProfile) {
      throw new NotFoundException('Module profile not found');
    }

    // Validate technology and scenario selection
    const { selectedTechnology, activeScenarioIds } = this.validateTechnologyAndScenarios(
      moduleProfile,
      dto.selectedTechnology,
      dto.activeScenarioIds,
    );

    // Validate dynamic fields against profile's field definitions (for selected technology)
    await this.validateDynamicFields(dto.dynamicFields, moduleProfile, selectedTechnology);

    // Check serial number uniqueness
    const existingModule = await this.prisma.device.findUnique({
      where: { serialNumber: dto.serialNumber },
    });

    if (existingModule) {
      throw new ConflictException(
        `Module with serial number ${dto.serialNumber} already exists`,
      );
    }

    const module = await this.prisma.device.create({
      data: {
        tenantId: dto.tenantId,
        deviceProfileId: dto.moduleProfileId,
        serialNumber: dto.serialNumber,
        status: dto.status || DeviceStatus.WAREHOUSE,
        selectedTechnology,
        activeScenarioIds,
        dynamicFields: dto.dynamicFields as any,
        metadata: dto.metadata as any,
      },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
        deviceProfile: {
          select: {
            id: true,
            brand: true,
            modelCode: true,
            communicationTechnology: true,
            specifications: true,
          },
        },
      },
    });

    this.logger.log(`Created module: ${module.serialNumber}`);
    return this.transformModuleResponse(module);
  }

  /**
   * Bulk create modules
   */
  async bulkCreate(
    dto: BulkCreateModuleDto,
    user: AuthenticatedUser,
  ): Promise<{ created: number; errors: string[] }> {
    // Verify tenant access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check tenant access (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Verify module profile exists
    const moduleProfile = await this.prisma.deviceProfile.findUnique({
      where: { id: dto.moduleProfileId },
    });

    if (!moduleProfile) {
      throw new NotFoundException('Module profile not found');
    }

    const errors: string[] = [];
    let created = 0;

    for (const moduleData of dto.modules) {
      try {
        // Validate dynamic fields
        await this.validateDynamicFields(moduleData.dynamicFields, moduleProfile);

        // Check serial number uniqueness
        const existing = await this.prisma.device.findUnique({
          where: { serialNumber: moduleData.serialNumber },
        });

        if (existing) {
          errors.push(`${moduleData.serialNumber}: Already exists`);
          continue;
        }

        await this.prisma.device.create({
          data: {
            tenantId: dto.tenantId,
            deviceProfileId: dto.moduleProfileId,
            serialNumber: moduleData.serialNumber,
            status: DeviceStatus.WAREHOUSE,
            dynamicFields: moduleData.dynamicFields as any,
            metadata: moduleData.metadata as any,
          },
        });

        created++;
      } catch (error) {
        errors.push(`${moduleData.serialNumber}: ${error.message}`);
      }
    }

    this.logger.log(`Bulk created ${created} modules, ${errors.length} errors`);

    return { created, errors };
  }

  /**
   * Get the effective tenant path for filtering
   * Supports both hierarchical access AND direct tenant assignments for multi-tenant users
   */
  private async getEffectiveTenantPath(user: AuthenticatedUser, tenantId?: string): Promise<string | null> {
    // Platform admin can see everything
    if (user.role === SYSTEM_ROLES.PLATFORM_ADMIN) {
      if (tenantId) {
        const selectedTenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { path: true },
        });
        return selectedTenant?.path || null;
      }
      return null;
    }

    if (tenantId) {
      // Check if user has direct assignment to the requested tenant
      const userTenantAssignment = await this.prisma.userTenant.findFirst({
        where: {
          userId: user.id,
          tenantId: tenantId,
        },
        include: {
          tenant: {
            select: { path: true },
          },
        },
      });

      if (userTenantAssignment) {
        // User has direct assignment to this tenant - allow access
        return userTenantAssignment.tenant.path;
      }

      // Check hierarchical access (user's tenant path contains selected tenant)
      const selectedTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { path: true },
      });

      if (selectedTenant && selectedTenant.path.startsWith(user.tenantPath)) {
        return selectedTenant.path;
      }

      // No access to requested tenant - fall back to user's primary tenant
      return user.tenantPath;
    }

    // No tenantId specified - use user's primary tenant path
    return user.tenantPath;
  }

  /**
   * Get all modules with pagination and filtering
   */
  async findAll(
    query: ModuleQueryDto,
    user: AuthenticatedUser,
  ): Promise<PaginatedResult<Module>> {
    const page = query.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(
      query.limit || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Get effective tenant path for filtering
    const effectivePath = await this.getEffectiveTenantPath(user, query.tenantId);
    
    if (effectivePath) {
      whereClause.tenant = {
        path: {
          startsWith: effectivePath,
        },
      };
    }

    if (query.moduleProfileId) {
      whereClause.deviceProfileId = query.moduleProfileId;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.brand) {
      whereClause.deviceProfile = {
        ...whereClause.deviceProfile,
        brand: query.brand,
      };
    }

    if (query.technology) {
      whereClause.deviceProfile = {
        ...whereClause.deviceProfile,
        communicationTechnology: query.technology,
      };
    }

    if (query.search) {
      whereClause.OR = [
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [modules, total] = await Promise.all([
      this.prisma.device.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        include: {
          tenant: {
            select: { id: true, name: true },
          },
          deviceProfile: {
            select: {
              id: true,
              brand: true,
              modelCode: true,
              communicationTechnology: true,
            },
          },
          meter: {
            select: { id: true, serialNumber: true },
          },
        },
      }),
      this.prisma.device.count({ where: whereClause }),
    ]);

    // Transform response to use frontend naming (moduleProfile instead of deviceProfile)
    const transformedModules = modules.map(m => this.transformModuleResponse(m));

    return {
      data: transformedModules,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get available modules (WAREHOUSE status) for linking
   */
  async findAvailable(
    tenantId: string,
    meterProfileId: string,
    user: AuthenticatedUser,
  ): Promise<Module[]> {
    // Verify tenant access
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }
    const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // Get compatible module profiles for this meter profile
    const meterProfile = await this.prisma.meterProfile.findUnique({
      where: { id: meterProfileId },
      include: {
        compatibleDeviceProfiles: {
          select: { id: true },
        },
      },
    });

    if (!meterProfile) {
      throw new NotFoundException('Meter profile not found');
    }

    const compatibleProfileIds = meterProfile.compatibleDeviceProfiles.map(
      (p) => p.id,
    );

    const modules = await this.prisma.device.findMany({
      where: {
        tenantId,
        status: DeviceStatus.WAREHOUSE,
        deviceProfileId: { in: compatibleProfileIds },
      },
      include: {
        deviceProfile: {
          select: {
            brand: true,
            modelCode: true,
            communicationTechnology: true,
          },
        },
      },
      orderBy: { serialNumber: 'asc' },
    });

    // Transform response to use frontend naming
    return modules.map(m => this.transformModuleResponse(m));
  }

  /**
   * Get module by ID
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<Module & { meter?: any }> {
    const module = await this.prisma.device.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, name: true, path: true },
        },
        deviceProfile: true,
        // Include the linked meter via Prisma's relation (inverse of Meter.activeDevice)
        meter: {
          select: {
            id: true,
            serialNumber: true,
            status: true,
            subscription: {
              select: { 
                id: true, 
                address: true,
                subscriptionNumber: true,
                subscriptionGroup: true,
                customer: { select: { id: true, details: true, customerType: true } },
              },
            },
            meterProfile: {
              select: { brand: true, modelCode: true },
            },
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check access (hierarchical OR direct assignment)
    const hasAccess = await this.hasUserAccessToTenant(user, (module as any).tenant.path, module.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this module');
    }

    // Transform response to use frontend naming (moduleProfile instead of deviceProfile)
    return this.transformModuleResponse(module);
  }

  /**
   * Transform module response to use frontend naming conventions
   * deviceProfile → moduleProfile
   */
  private transformModuleResponse(module: any): any {
    if (!module) return module;
    
    const transformed = { ...module };
    
    // Transform deviceProfile to moduleProfile
    if (module.deviceProfile) {
      transformed.moduleProfile = module.deviceProfile;
      delete transformed.deviceProfile;
    }
    
    return transformed;
  }

  /**
   * Find module by dynamic field (e.g., DevEUI for LoRaWAN)
   */
  async findByDynamicField(
    fieldName: string,
    fieldValue: string,
  ): Promise<Module | null> {
    const modules = await this.prisma.$queryRaw<Module[]>`
      SELECT d.*, dp.decoder_function, dp.communication_technology
      FROM devices d
      JOIN device_profiles dp ON d.device_profile_id = dp.id
      WHERE LOWER(d.dynamic_fields->>${fieldName}) = ${fieldValue.toLowerCase()}
      LIMIT 1
    `;

    return modules.length > 0 ? modules[0] : null;
  }

  /**
   * Update module
   */
  async update(
    id: string,
    dto: UpdateModuleDto,
    user: AuthenticatedUser,
  ): Promise<Module> {
    const module = await this.findOne(id, user);

    const moduleProfile = await this.prisma.deviceProfile.findUnique({
      where: { id: module.deviceProfileId },
    });

    // Validate technology and scenario selection if provided
    let selectedTechnology: CommunicationTechnology | null | undefined = dto.selectedTechnology as CommunicationTechnology | undefined;
    let activeScenarioIds = dto.activeScenarioIds;
    
    if (dto.selectedTechnology !== undefined || dto.activeScenarioIds !== undefined) {
      const validated = this.validateTechnologyAndScenarios(
        moduleProfile!,
        dto.selectedTechnology ?? module.selectedTechnology,
        dto.activeScenarioIds ?? module.activeScenarioIds,
      );
      selectedTechnology = validated.selectedTechnology;
      activeScenarioIds = validated.activeScenarioIds;
    }

    // Validate dynamic fields if changed
    if (dto.dynamicFields) {
      await this.validateDynamicFields(
        dto.dynamicFields, 
        moduleProfile!, 
        selectedTechnology ?? module.selectedTechnology,
      );
    }

    // Prevent status change if module is linked to a meter
    if (dto.status && module.meter) {
      if (dto.status === DeviceStatus.WAREHOUSE) {
        throw new BadRequestException(
          'Cannot set status to WAREHOUSE while module is linked to a meter. Unlink first.',
        );
      }
    }

    const updated = await this.prisma.device.update({
      where: { id },
      data: {
        status: dto.status,
        selectedTechnology,
        activeScenarioIds,
        dynamicFields: dto.dynamicFields as any,
        lastSignalStrength: dto.lastSignalStrength,
        lastBatteryLevel: dto.lastBatteryLevel,
        metadata: dto.metadata as any,
        ...(dto.lastSignalStrength !== undefined || dto.lastBatteryLevel !== undefined
          ? { lastCommunicationAt: new Date() }
          : {}),
      },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
        deviceProfile: {
          select: {
            brand: true,
            modelCode: true,
            communicationTechnology: true,
            specifications: true,
          },
        },
        meter: {
          select: { id: true, serialNumber: true },
        },
      },
    });

    this.logger.log(`Updated module: ${updated.serialNumber}`);
    return this.transformModuleResponse(updated);
  }

  /**
   * Delete module
   */
  async delete(id: string, user: AuthenticatedUser): Promise<void> {
    const module = await this.findOne(id, user);

    // Prevent deletion if module is linked to a meter
    if (module.meter) {
      throw new BadRequestException(
        'Cannot delete module while it is linked to a meter. Unlink first.',
      );
    }

    await this.prisma.device.delete({
      where: { id },
    });

    this.logger.log(`Deleted module: ${module.serialNumber}`);
  }

  /**
   * Validate and resolve technology and scenario selection for a module
   */
  private validateTechnologyAndScenarios(
    profile: any,
    selectedTechnology?: CommunicationTechnology | string | null,
    activeScenarioIds?: string[],
  ): { selectedTechnology: CommunicationTechnology | null; activeScenarioIds: string[] } {
    const specs = profile.specifications as any;
    const communicationConfigs = specs?.communicationConfigs || [];
    
    // If no communication configs, fall back to legacy behavior
    if (communicationConfigs.length === 0) {
      return {
        selectedTechnology: profile.communicationTechnology as CommunicationTechnology | null,
        activeScenarioIds: [],
      };
    }
    
    // If profile has only one technology, auto-select it
    let resolvedTechnology: CommunicationTechnology | null = selectedTechnology as CommunicationTechnology | null;
    if (communicationConfigs.length === 1) {
      resolvedTechnology = communicationConfigs[0].technology as CommunicationTechnology;
    }
    
    // Validate selected technology exists in profile
    if (resolvedTechnology) {
      const techConfig = communicationConfigs.find(
        (c: any) => c.technology === resolvedTechnology,
      );
      
      if (!techConfig) {
        const validTechs = communicationConfigs.map((c: any) => c.technology).join(', ');
        throw new BadRequestException(
          `Invalid technology "${resolvedTechnology}". Valid options: ${validTechs}`,
        );
      }
      
      // Validate scenario IDs if provided
      if (activeScenarioIds && activeScenarioIds.length > 0) {
        const validScenarioIds = (techConfig.scenarios || []).map((s: any) => s.id);
        
        for (const scenarioId of activeScenarioIds) {
          if (!validScenarioIds.includes(scenarioId)) {
            throw new BadRequestException(
              `Invalid scenario ID "${scenarioId}" for technology "${resolvedTechnology}"`,
            );
          }
        }
        
        return { selectedTechnology: resolvedTechnology, activeScenarioIds };
      }
      
      // If no scenarios specified, use default scenario(s)
      const defaultScenarios = (techConfig.scenarios || [])
        .filter((s: any) => s.isDefault)
        .map((s: any) => s.id);
      
      return {
        selectedTechnology: resolvedTechnology,
        activeScenarioIds: defaultScenarios.length > 0 ? defaultScenarios : [],
      };
    }
    
    // If multiple technologies and none selected, require selection
    if (communicationConfigs.length > 1) {
      const validTechs = communicationConfigs.map((c: any) => c.technology).join(', ');
      throw new BadRequestException(
        `Module profile has multiple technologies. Please select one: ${validTechs}`,
      );
    }
    
    return {
      selectedTechnology: null,
      activeScenarioIds: activeScenarioIds || [],
    };
  }

  /**
   * Validate dynamic fields against profile's field definitions
   * Optionally filter by selected technology
   */
  private async validateDynamicFields(
    fields: Record<string, string>,
    profile: any,
    selectedTechnology?: string | null,
  ): Promise<void> {
    let fieldDefs = (profile.fieldDefinitions as any[]) || [];
    
    // If we have communication configs with scenarios, get fields from the selected technology
    const specs = profile.specifications as any;
    const communicationConfigs = specs?.communicationConfigs || [];
    
    if (communicationConfigs.length > 0 && selectedTechnology) {
      const techConfig = communicationConfigs.find(
        (c: any) => c.technology === selectedTechnology,
      );
      
      if (techConfig?.fieldDefinitions) {
        fieldDefs = techConfig.fieldDefinitions;
      }
    }

    for (const fieldDef of fieldDefs) {
      const value = fields[fieldDef.name];

      if (fieldDef.required && !value) {
        throw new BadRequestException(`${fieldDef.name} is required`);
      }

      if (value && fieldDef.regex) {
        const regex = new RegExp(fieldDef.regex);
        if (!regex.test(value)) {
          throw new BadRequestException(
            `${fieldDef.name} has invalid format. Expected: ${fieldDef.regex}`,
          );
        }
      }

      if (value && fieldDef.length && value.length !== fieldDef.length) {
        throw new BadRequestException(
          `${fieldDef.name} must be exactly ${fieldDef.length} characters`,
        );
      }
    }
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Export modules with filters (limited to 10,000 rows)
   */
  async exportModules(query: ExportModulesQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Module>> {
    const MAX_EXPORT_LIMIT = 10000;
    const limit = Math.min(query.limit || MAX_EXPORT_LIMIT, MAX_EXPORT_LIMIT);
    
    return this.findAll({ ...query, page: 1, limit }, user);
  }

  /**
   * Bulk import modules from CSV data
   */
  async bulkImport(dto: BulkImportModulesDto, user: AuthenticatedUser): Promise<{
    success: boolean;
    totalRows: number;
    importedRows: number;
    failedRows: number;
    errors: Array<{ row: number; field: string; message: string }>;
  }> {
    const { rows, namePrefix = '', nameSuffix = '', moduleProfileId } = dto;
    const errors: Array<{ row: number; field: string; message: string }> = [];
    let importedRows = 0;

    // Verify module profile exists
    const profile = await this.prisma.deviceProfile.findUnique({
      where: { id: moduleProfileId },
    });

    if (!profile) {
      return {
        success: false,
        totalRows: rows.length,
        importedRows: 0,
        failedRows: rows.length,
        errors: [{ row: 0, field: 'moduleProfileId', message: 'Module profile not found' }],
      };
    }

    // Get user's accessible tenant
    const tenant = await this.prisma.tenant.findFirst({
      where: { path: { startsWith: user.tenantPath } },
    });

    if (!tenant) {
      return {
        success: false,
        totalRows: rows.length,
        importedRows: 0,
        failedRows: rows.length,
        errors: [{ row: 0, field: 'tenant', message: 'No accessible tenant found' }],
      };
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header and arrays are 0-indexed

      try {
        const serialNumber = `${namePrefix}${row.serialNumber}${nameSuffix}`;

        // Check for duplicate serial number
        const existingModule = await this.prisma.device.findUnique({
          where: { serialNumber },
        });

        if (existingModule) {
          errors.push({
            row: rowNumber,
            field: 'serialNumber',
            message: `Serial number "${serialNumber}" already exists`,
          });
          continue;
        }

        // Extract dynamic fields from row (exclude known columns)
        const knownColumns = ['serialNumber', 'status'];
        const dynamicFields: Record<string, string> = {};
        
        for (const [key, value] of Object.entries(row)) {
          if (!knownColumns.includes(key) && value) {
            dynamicFields[key] = String(value);
          }
        }

        // Validate dynamic fields
        try {
          await this.validateDynamicFields(dynamicFields, profile, profile.communicationTechnology);
        } catch (validationError) {
          errors.push({
            row: rowNumber,
            field: 'dynamicFields',
            message: validationError.message,
          });
          continue;
        }

        // Create the module
        await this.prisma.device.create({
          data: {
            tenantId: tenant.id,
            deviceProfileId: moduleProfileId,
            serialNumber,
            status: (row.status as DeviceStatus) || DeviceStatus.WAREHOUSE,
            dynamicFields: dynamicFields as any,
          },
        });

        importedRows++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'unknown',
          message: error.message || 'Unknown error',
        });
      }
    }

    this.logger.log(`Bulk import: ${importedRows}/${rows.length} modules imported`);

    return {
      success: errors.length === 0,
      totalRows: rows.length,
      importedRows,
      failedRows: rows.length - importedRows,
      errors,
    };
  }
}

// Export as DevicesService for backward compatibility
export { ModulesService as DevicesService };
