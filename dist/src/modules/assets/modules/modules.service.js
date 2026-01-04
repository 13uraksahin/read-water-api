"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ModulesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = exports.ModulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const constants_1 = require("../../../common/constants");
const client_1 = require("@prisma/client");
let ModulesService = ModulesService_1 = class ModulesService {
    prisma;
    logger = new common_1.Logger(ModulesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async hasUserAccessToTenant(user, tenantPath, tenantId) {
        if (user.role === constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            return true;
        }
        if (tenantPath.startsWith(user.tenantPath) || user.tenantPath.startsWith(tenantPath)) {
            return true;
        }
        const directAssignment = await this.prisma.userTenant.findFirst({
            where: {
                userId: user.id,
                tenantId: tenantId,
            },
        });
        return !!directAssignment;
    }
    async create(dto, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenant.id);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this tenant');
        }
        const moduleProfile = await this.prisma.deviceProfile.findUnique({
            where: { id: dto.moduleProfileId },
        });
        if (!moduleProfile) {
            throw new common_1.NotFoundException('Module profile not found');
        }
        const { selectedTechnology, activeScenarioIds } = this.validateTechnologyAndScenarios(moduleProfile, dto.selectedTechnology, dto.activeScenarioIds);
        await this.validateDynamicFields(dto.dynamicFields, moduleProfile, selectedTechnology);
        const existingModule = await this.prisma.device.findUnique({
            where: { serialNumber: dto.serialNumber },
        });
        if (existingModule) {
            throw new common_1.ConflictException(`Module with serial number ${dto.serialNumber} already exists`);
        }
        const module = await this.prisma.device.create({
            data: {
                tenantId: dto.tenantId,
                deviceProfileId: dto.moduleProfileId,
                serialNumber: dto.serialNumber,
                status: dto.status || client_1.DeviceStatus.WAREHOUSE,
                selectedTechnology,
                activeScenarioIds,
                dynamicFields: dto.dynamicFields,
                metadata: dto.metadata,
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
        return module;
    }
    async bulkCreate(dto, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenant.id);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this tenant');
        }
        const moduleProfile = await this.prisma.deviceProfile.findUnique({
            where: { id: dto.moduleProfileId },
        });
        if (!moduleProfile) {
            throw new common_1.NotFoundException('Module profile not found');
        }
        const errors = [];
        let created = 0;
        for (const moduleData of dto.modules) {
            try {
                await this.validateDynamicFields(moduleData.dynamicFields, moduleProfile);
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
                        status: client_1.DeviceStatus.WAREHOUSE,
                        dynamicFields: moduleData.dynamicFields,
                        metadata: moduleData.metadata,
                    },
                });
                created++;
            }
            catch (error) {
                errors.push(`${moduleData.serialNumber}: ${error.message}`);
            }
        }
        this.logger.log(`Bulk created ${created} modules, ${errors.length} errors`);
        return { created, errors };
    }
    async getEffectiveTenantPath(user, tenantId) {
        if (user.role === constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
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
                return userTenantAssignment.tenant.path;
            }
            const selectedTenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { path: true },
            });
            if (selectedTenant && selectedTenant.path.startsWith(user.tenantPath)) {
                return selectedTenant.path;
            }
            return user.tenantPath;
        }
        return user.tenantPath;
    }
    async findAll(query, user) {
        const page = query.page || constants_1.PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const whereClause = {};
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
        return {
            data: modules,
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
    async findAvailable(tenantId, meterProfileId, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.ForbiddenException('Tenant not found');
        }
        const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenantId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this tenant');
        }
        const meterProfile = await this.prisma.meterProfile.findUnique({
            where: { id: meterProfileId },
            include: {
                compatibleDeviceProfiles: {
                    select: { id: true },
                },
            },
        });
        if (!meterProfile) {
            throw new common_1.NotFoundException('Meter profile not found');
        }
        const compatibleProfileIds = meterProfile.compatibleDeviceProfiles.map((p) => p.id);
        return this.prisma.device.findMany({
            where: {
                tenantId,
                status: client_1.DeviceStatus.WAREHOUSE,
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
    }
    async findOne(id, user) {
        const module = await this.prisma.device.findUnique({
            where: { id },
            include: {
                tenant: {
                    select: { id: true, name: true, path: true },
                },
                deviceProfile: true,
                meter: {
                    select: {
                        id: true,
                        serialNumber: true,
                        status: true,
                        subscription: {
                            select: {
                                id: true,
                                address: true,
                                customer: { select: { id: true, details: true } },
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
            throw new common_1.NotFoundException('Module not found');
        }
        const hasAccess = await this.hasUserAccessToTenant(user, module.tenant.path, module.tenantId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this module');
        }
        return module;
    }
    async findByDynamicField(fieldName, fieldValue) {
        const modules = await this.prisma.$queryRaw `
      SELECT d.*, dp.decoder_function, dp.communication_technology
      FROM devices d
      JOIN device_profiles dp ON d.device_profile_id = dp.id
      WHERE LOWER(d.dynamic_fields->>${fieldName}) = ${fieldValue.toLowerCase()}
      LIMIT 1
    `;
        return modules.length > 0 ? modules[0] : null;
    }
    async update(id, dto, user) {
        const module = await this.findOne(id, user);
        const moduleProfile = await this.prisma.deviceProfile.findUnique({
            where: { id: module.deviceProfileId },
        });
        let selectedTechnology = dto.selectedTechnology;
        let activeScenarioIds = dto.activeScenarioIds;
        if (dto.selectedTechnology !== undefined || dto.activeScenarioIds !== undefined) {
            const validated = this.validateTechnologyAndScenarios(moduleProfile, dto.selectedTechnology ?? module.selectedTechnology, dto.activeScenarioIds ?? module.activeScenarioIds);
            selectedTechnology = validated.selectedTechnology;
            activeScenarioIds = validated.activeScenarioIds;
        }
        if (dto.dynamicFields) {
            await this.validateDynamicFields(dto.dynamicFields, moduleProfile, selectedTechnology ?? module.selectedTechnology);
        }
        if (dto.status && module.meter) {
            if (dto.status === client_1.DeviceStatus.WAREHOUSE) {
                throw new common_1.BadRequestException('Cannot set status to WAREHOUSE while module is linked to a meter. Unlink first.');
            }
        }
        const updated = await this.prisma.device.update({
            where: { id },
            data: {
                status: dto.status,
                selectedTechnology,
                activeScenarioIds,
                dynamicFields: dto.dynamicFields,
                lastSignalStrength: dto.lastSignalStrength,
                lastBatteryLevel: dto.lastBatteryLevel,
                metadata: dto.metadata,
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
        return updated;
    }
    async delete(id, user) {
        const module = await this.findOne(id, user);
        if (module.meter) {
            throw new common_1.BadRequestException('Cannot delete module while it is linked to a meter. Unlink first.');
        }
        await this.prisma.device.delete({
            where: { id },
        });
        this.logger.log(`Deleted module: ${module.serialNumber}`);
    }
    validateTechnologyAndScenarios(profile, selectedTechnology, activeScenarioIds) {
        const specs = profile.specifications;
        const communicationConfigs = specs?.communicationConfigs || [];
        if (communicationConfigs.length === 0) {
            return {
                selectedTechnology: profile.communicationTechnology,
                activeScenarioIds: [],
            };
        }
        let resolvedTechnology = selectedTechnology;
        if (communicationConfigs.length === 1) {
            resolvedTechnology = communicationConfigs[0].technology;
        }
        if (resolvedTechnology) {
            const techConfig = communicationConfigs.find((c) => c.technology === resolvedTechnology);
            if (!techConfig) {
                const validTechs = communicationConfigs.map((c) => c.technology).join(', ');
                throw new common_1.BadRequestException(`Invalid technology "${resolvedTechnology}". Valid options: ${validTechs}`);
            }
            if (activeScenarioIds && activeScenarioIds.length > 0) {
                const validScenarioIds = (techConfig.scenarios || []).map((s) => s.id);
                for (const scenarioId of activeScenarioIds) {
                    if (!validScenarioIds.includes(scenarioId)) {
                        throw new common_1.BadRequestException(`Invalid scenario ID "${scenarioId}" for technology "${resolvedTechnology}"`);
                    }
                }
                return { selectedTechnology: resolvedTechnology, activeScenarioIds };
            }
            const defaultScenarios = (techConfig.scenarios || [])
                .filter((s) => s.isDefault)
                .map((s) => s.id);
            return {
                selectedTechnology: resolvedTechnology,
                activeScenarioIds: defaultScenarios.length > 0 ? defaultScenarios : [],
            };
        }
        if (communicationConfigs.length > 1) {
            const validTechs = communicationConfigs.map((c) => c.technology).join(', ');
            throw new common_1.BadRequestException(`Module profile has multiple technologies. Please select one: ${validTechs}`);
        }
        return {
            selectedTechnology: null,
            activeScenarioIds: activeScenarioIds || [],
        };
    }
    async validateDynamicFields(fields, profile, selectedTechnology) {
        let fieldDefs = profile.fieldDefinitions || [];
        const specs = profile.specifications;
        const communicationConfigs = specs?.communicationConfigs || [];
        if (communicationConfigs.length > 0 && selectedTechnology) {
            const techConfig = communicationConfigs.find((c) => c.technology === selectedTechnology);
            if (techConfig?.fieldDefinitions) {
                fieldDefs = techConfig.fieldDefinitions;
            }
        }
        for (const fieldDef of fieldDefs) {
            const value = fields[fieldDef.name];
            if (fieldDef.required && !value) {
                throw new common_1.BadRequestException(`${fieldDef.name} is required`);
            }
            if (value && fieldDef.regex) {
                const regex = new RegExp(fieldDef.regex);
                if (!regex.test(value)) {
                    throw new common_1.BadRequestException(`${fieldDef.name} has invalid format. Expected: ${fieldDef.regex}`);
                }
            }
            if (value && fieldDef.length && value.length !== fieldDef.length) {
                throw new common_1.BadRequestException(`${fieldDef.name} must be exactly ${fieldDef.length} characters`);
            }
        }
    }
    async exportModules(query, user) {
        const MAX_EXPORT_LIMIT = 10000;
        const limit = Math.min(query.limit || MAX_EXPORT_LIMIT, MAX_EXPORT_LIMIT);
        return this.findAll({ ...query, page: 1, limit }, user);
    }
    async bulkImport(dto, user) {
        const { rows, namePrefix = '', nameSuffix = '', moduleProfileId } = dto;
        const errors = [];
        let importedRows = 0;
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
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;
            try {
                const serialNumber = `${namePrefix}${row.serialNumber}${nameSuffix}`;
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
                const knownColumns = ['serialNumber', 'status'];
                const dynamicFields = {};
                for (const [key, value] of Object.entries(row)) {
                    if (!knownColumns.includes(key) && value) {
                        dynamicFields[key] = String(value);
                    }
                }
                try {
                    await this.validateDynamicFields(dynamicFields, profile, profile.communicationTechnology);
                }
                catch (validationError) {
                    errors.push({
                        row: rowNumber,
                        field: 'dynamicFields',
                        message: validationError.message,
                    });
                    continue;
                }
                await this.prisma.device.create({
                    data: {
                        tenantId: tenant.id,
                        deviceProfileId: moduleProfileId,
                        serialNumber,
                        status: row.status || client_1.DeviceStatus.WAREHOUSE,
                        dynamicFields: dynamicFields,
                    },
                });
                importedRows++;
            }
            catch (error) {
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
};
exports.ModulesService = ModulesService;
exports.DevicesService = ModulesService;
exports.DevicesService = exports.ModulesService = ModulesService = ModulesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ModulesService);
//# sourceMappingURL=modules.service.js.map