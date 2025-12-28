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
var DevicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const constants_1 = require("../../../common/constants");
const client_1 = require("@prisma/client");
let DevicesService = DevicesService_1 = class DevicesService {
    prisma;
    logger = new common_1.Logger(DevicesService_1.name);
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
        const deviceProfile = await this.prisma.deviceProfile.findUnique({
            where: { id: dto.deviceProfileId },
        });
        if (!deviceProfile) {
            throw new common_1.NotFoundException('Device profile not found');
        }
        const { selectedTechnology, activeScenarioIds } = this.validateTechnologyAndScenarios(deviceProfile, dto.selectedTechnology, dto.activeScenarioIds);
        await this.validateDynamicFields(dto.dynamicFields, deviceProfile, selectedTechnology);
        const existingDevice = await this.prisma.device.findUnique({
            where: { serialNumber: dto.serialNumber },
        });
        if (existingDevice) {
            throw new common_1.ConflictException(`Device with serial number ${dto.serialNumber} already exists`);
        }
        const device = await this.prisma.device.create({
            data: {
                tenantId: dto.tenantId,
                deviceProfileId: dto.deviceProfileId,
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
        this.logger.log(`Created device: ${device.serialNumber}`);
        return device;
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
        const deviceProfile = await this.prisma.deviceProfile.findUnique({
            where: { id: dto.deviceProfileId },
        });
        if (!deviceProfile) {
            throw new common_1.NotFoundException('Device profile not found');
        }
        const errors = [];
        let created = 0;
        for (const deviceData of dto.devices) {
            try {
                await this.validateDynamicFields(deviceData.dynamicFields, deviceProfile);
                const existing = await this.prisma.device.findUnique({
                    where: { serialNumber: deviceData.serialNumber },
                });
                if (existing) {
                    errors.push(`${deviceData.serialNumber}: Already exists`);
                    continue;
                }
                await this.prisma.device.create({
                    data: {
                        tenantId: dto.tenantId,
                        deviceProfileId: dto.deviceProfileId,
                        serialNumber: deviceData.serialNumber,
                        status: client_1.DeviceStatus.WAREHOUSE,
                        dynamicFields: deviceData.dynamicFields,
                        metadata: deviceData.metadata,
                    },
                });
                created++;
            }
            catch (error) {
                errors.push(`${deviceData.serialNumber}: ${error.message}`);
            }
        }
        this.logger.log(`Bulk created ${created} devices, ${errors.length} errors`);
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
        if (query.deviceProfileId) {
            whereClause.deviceProfileId = query.deviceProfileId;
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
        const [devices, total] = await Promise.all([
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
            data: devices,
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
        const device = await this.prisma.device.findUnique({
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
        if (!device) {
            throw new common_1.NotFoundException('Device not found');
        }
        const hasAccess = await this.hasUserAccessToTenant(user, device.tenant.path, device.tenantId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this device');
        }
        return device;
    }
    async findByDynamicField(fieldName, fieldValue) {
        const devices = await this.prisma.$queryRaw `
      SELECT d.*, dp.decoder_function, dp.communication_technology
      FROM devices d
      JOIN device_profiles dp ON d.device_profile_id = dp.id
      WHERE LOWER(d.dynamic_fields->>${fieldName}) = ${fieldValue.toLowerCase()}
      LIMIT 1
    `;
        return devices.length > 0 ? devices[0] : null;
    }
    async update(id, dto, user) {
        const device = await this.findOne(id, user);
        const deviceProfile = await this.prisma.deviceProfile.findUnique({
            where: { id: device.deviceProfileId },
        });
        let selectedTechnology = dto.selectedTechnology;
        let activeScenarioIds = dto.activeScenarioIds;
        if (dto.selectedTechnology !== undefined || dto.activeScenarioIds !== undefined) {
            const validated = this.validateTechnologyAndScenarios(deviceProfile, dto.selectedTechnology ?? device.selectedTechnology, dto.activeScenarioIds ?? device.activeScenarioIds);
            selectedTechnology = validated.selectedTechnology;
            activeScenarioIds = validated.activeScenarioIds;
        }
        if (dto.dynamicFields) {
            await this.validateDynamicFields(dto.dynamicFields, deviceProfile, selectedTechnology ?? device.selectedTechnology);
        }
        if (dto.status && device.meter) {
            if (dto.status === client_1.DeviceStatus.WAREHOUSE) {
                throw new common_1.BadRequestException('Cannot set status to WAREHOUSE while device is linked to a meter. Unlink first.');
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
        this.logger.log(`Updated device: ${updated.serialNumber}`);
        return updated;
    }
    async delete(id, user) {
        const device = await this.findOne(id, user);
        if (device.meter) {
            throw new common_1.BadRequestException('Cannot delete device while it is linked to a meter. Unlink first.');
        }
        await this.prisma.device.delete({
            where: { id },
        });
        this.logger.log(`Deleted device: ${device.serialNumber}`);
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
        if (communicationConfigs.length === 1) {
            selectedTechnology = communicationConfigs[0].technology;
        }
        if (selectedTechnology) {
            const techConfig = communicationConfigs.find((c) => c.technology === selectedTechnology);
            if (!techConfig) {
                const validTechs = communicationConfigs.map((c) => c.technology).join(', ');
                throw new common_1.BadRequestException(`Invalid technology "${selectedTechnology}". Valid options: ${validTechs}`);
            }
            if (activeScenarioIds && activeScenarioIds.length > 0) {
                const validScenarioIds = (techConfig.scenarios || []).map((s) => s.id);
                for (const scenarioId of activeScenarioIds) {
                    if (!validScenarioIds.includes(scenarioId)) {
                        throw new common_1.BadRequestException(`Invalid scenario ID "${scenarioId}" for technology "${selectedTechnology}"`);
                    }
                }
                return { selectedTechnology, activeScenarioIds };
            }
            const defaultScenarios = (techConfig.scenarios || [])
                .filter((s) => s.isDefault)
                .map((s) => s.id);
            return {
                selectedTechnology,
                activeScenarioIds: defaultScenarios.length > 0 ? defaultScenarios : [],
            };
        }
        if (communicationConfigs.length > 1) {
            const validTechs = communicationConfigs.map((c) => c.technology).join(', ');
            throw new common_1.BadRequestException(`Device profile has multiple technologies. Please select one: ${validTechs}`);
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
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = DevicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map