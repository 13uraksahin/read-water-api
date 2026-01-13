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
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const constants_1 = require("../../common/constants");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    prisma;
    logger = new common_1.Logger(SubscriptionsService_1.name);
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
        const where = {};
        const effectivePath = await this.getEffectiveTenantPath(user, query.tenantId);
        if (effectivePath) {
            where.tenant = {
                path: {
                    startsWith: effectivePath,
                },
            };
        }
        if (query.customerId) {
            where.customerId = query.customerId;
        }
        if (query.isActive !== undefined) {
            where.isActive = query.isActive;
        }
        if (query.subscriptionGroup) {
            where.subscriptionGroup = query.subscriptionGroup;
        }
        if (query.search) {
            where.OR = [
                {
                    address: {
                        path: ['city'],
                        string_contains: query.search,
                    },
                },
                {
                    address: {
                        path: ['district'],
                        string_contains: query.search,
                    },
                },
                {
                    address: {
                        path: ['neighborhood'],
                        string_contains: query.search,
                    },
                },
                {
                    addressCode: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        const [total, subscriptions] = await Promise.all([
            this.prisma.subscription.count({ where }),
            this.prisma.subscription.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            path: true,
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            customerType: true,
                            details: true,
                        },
                    },
                    meters: {
                        select: {
                            id: true,
                            serialNumber: true,
                            status: true,
                            lastReadingValue: true,
                            lastReadingTime: true,
                            activeDevice: {
                                select: {
                                    id: true,
                                    serialNumber: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        const totalPages = Math.ceil(total / limit);
        const transformedSubscriptions = subscriptions.map(sub => this.transformSubscriptionResponse(sub));
        return {
            data: transformedSubscriptions,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }
    async findOne(id, user) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        path: true,
                    },
                },
                customer: true,
                meters: {
                    include: {
                        meterProfile: {
                            select: {
                                id: true,
                                brand: true,
                                modelCode: true,
                                meterType: true,
                            },
                        },
                        activeDevice: {
                            include: {
                                deviceProfile: {
                                    select: {
                                        id: true,
                                        brand: true,
                                        modelCode: true,
                                        communicationTechnology: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!subscription) {
            throw new common_1.NotFoundException(`Subscription with ID ${id} not found`);
        }
        const hasAccess = await this.hasUserAccessToTenant(user, subscription.tenant.path, subscription.tenantId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this subscription');
        }
        return this.transformSubscriptionResponse(subscription);
    }
    transformSubscriptionResponse(subscription) {
        if (!subscription)
            return subscription;
        const transformed = { ...subscription };
        if (transformed.meters && Array.isArray(transformed.meters)) {
            transformed.meters = transformed.meters.map((meter) => {
                const transformedMeter = { ...meter };
                if (meter.activeDevice) {
                    const device = meter.activeDevice;
                    transformedMeter.activeModule = {
                        ...device,
                        moduleProfile: device.deviceProfile,
                    };
                    delete transformedMeter.activeModule.deviceProfile;
                }
                delete transformedMeter.activeDevice;
                return transformedMeter;
            });
        }
        return transformed;
    }
    async generateSubscriptionNumber(tenantId) {
        const count = await this.prisma.subscription.count({
            where: { tenantId },
        });
        const timestamp = Date.now().toString(36).toUpperCase();
        return `S-${(count + 1).toString().padStart(6, '0')}-${timestamp}`;
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
            throw new common_1.ForbiddenException('You do not have access to create subscriptions in this tenant');
        }
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: dto.customerId,
                tenantId: dto.tenantId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found or does not belong to this tenant');
        }
        const subscriptionNumber = dto.subscriptionNumber || await this.generateSubscriptionNumber(dto.tenantId);
        const subscription = await this.prisma.subscription.create({
            data: {
                tenantId: dto.tenantId,
                customerId: dto.customerId,
                subscriptionNumber,
                subscriptionGroup: (dto.subscriptionGroup || 'NORMAL_CONSUMPTION'),
                address: dto.address,
                addressCode: dto.addressCode,
                latitude: dto.latitude,
                longitude: dto.longitude,
                isActive: dto.isActive ?? true,
                startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                metadata: dto.metadata,
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        path: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        customerType: true,
                        details: true,
                    },
                },
            },
        });
        this.logger.log(`Created subscription in tenant ${tenant.name}`);
        return subscription;
    }
    async update(id, dto, user) {
        const existing = await this.findOne(id, user);
        const subscription = await this.prisma.subscription.update({
            where: { id },
            data: {
                ...(dto.subscriptionGroup && { subscriptionGroup: dto.subscriptionGroup }),
                ...(dto.address && { address: dto.address }),
                ...(dto.addressCode !== undefined && { addressCode: dto.addressCode }),
                ...(dto.latitude !== undefined && { latitude: dto.latitude }),
                ...(dto.longitude !== undefined && { longitude: dto.longitude }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
                ...(dto.metadata !== undefined && { metadata: dto.metadata }),
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        path: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        customerType: true,
                        details: true,
                    },
                },
                meters: {
                    select: {
                        id: true,
                        serialNumber: true,
                        status: true,
                    },
                },
            },
        });
        return subscription;
    }
    async delete(id, user) {
        const existing = await this.findOne(id, user);
        const meterCount = await this.prisma.meter.count({
            where: { subscriptionId: id },
        });
        if (meterCount > 0) {
            throw new common_1.ForbiddenException(`Cannot delete subscription with ${meterCount} linked meters. Unlink meters first.`);
        }
        await this.prisma.subscription.delete({ where: { id } });
        this.logger.log(`Deleted subscription ${id}`);
    }
    async linkMeter(subscriptionId, meterId, user) {
        const subscription = await this.findOne(subscriptionId, user);
        const meter = await this.prisma.meter.findFirst({
            where: {
                id: meterId,
                tenantId: subscription.tenantId,
            },
        });
        if (!meter) {
            throw new common_1.NotFoundException('Meter not found or does not belong to this tenant');
        }
        if (meter.subscriptionId && meter.subscriptionId !== subscriptionId) {
            throw new common_1.ForbiddenException('Meter is already linked to another subscription');
        }
        await this.prisma.meter.update({
            where: { id: meterId },
            data: { subscriptionId },
        });
        return this.findOne(subscriptionId, user);
    }
    async unlinkMeter(subscriptionId, meterId, user) {
        const subscription = await this.findOne(subscriptionId, user);
        const meter = await this.prisma.meter.findFirst({
            where: {
                id: meterId,
                subscriptionId,
            },
        });
        if (!meter) {
            throw new common_1.NotFoundException('Meter not found or not linked to this subscription');
        }
        await this.prisma.meter.update({
            where: { id: meterId },
            data: { subscriptionId: null },
        });
        return this.findOne(subscriptionId, user);
    }
    async exportSubscriptions(query, user) {
        const MAX_EXPORT_LIMIT = 10000;
        const limit = Math.min(query.limit || MAX_EXPORT_LIMIT, MAX_EXPORT_LIMIT);
        return this.findAll({ ...query, page: 1, limit }, user);
    }
    async bulkImport(dto, user) {
        const { rows } = dto;
        const errors = [];
        let importedRows = 0;
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
                if (!row.subscriptionNumber) {
                    errors.push({
                        row: rowNumber,
                        field: 'subscriptionNumber',
                        message: 'Subscription number is required',
                    });
                    continue;
                }
                if (!row.customerNumber) {
                    errors.push({
                        row: rowNumber,
                        field: 'customerNumber',
                        message: 'Customer number is required',
                    });
                    continue;
                }
                const customer = await this.prisma.customer.findFirst({
                    where: {
                        tenantId: tenant.id,
                        customerNumber: row.customerNumber,
                    },
                });
                if (!customer) {
                    errors.push({
                        row: rowNumber,
                        field: 'customerNumber',
                        message: `Customer with number "${row.customerNumber}" not found`,
                    });
                    continue;
                }
                const existingSubscription = await this.prisma.subscription.findFirst({
                    where: {
                        tenantId: tenant.id,
                        subscriptionNumber: row.subscriptionNumber,
                    },
                });
                if (existingSubscription) {
                    errors.push({
                        row: rowNumber,
                        field: 'subscriptionNumber',
                        message: `Subscription number "${row.subscriptionNumber}" already exists`,
                    });
                    continue;
                }
                const address = {};
                if (row.city)
                    address.city = row.city;
                if (row.district)
                    address.district = row.district;
                if (row.neighborhood)
                    address.neighborhood = row.neighborhood;
                if (row.street)
                    address.street = row.street;
                if (row.buildingNo)
                    address.buildingNo = row.buildingNo;
                if (row.floor)
                    address.floor = row.floor;
                if (row.doorNo)
                    address.doorNo = row.doorNo;
                if (row.postalCode)
                    address.postalCode = row.postalCode;
                if (row.addressCode)
                    address.addressCode = row.addressCode;
                let subscriptionGroup = 'NORMAL_CONSUMPTION';
                if (row.subscriptionGroup && ['NORMAL_CONSUMPTION', 'HIGH_CONSUMPTION'].includes(row.subscriptionGroup)) {
                    subscriptionGroup = row.subscriptionGroup;
                }
                const latitude = row.latitude ? parseFloat(row.latitude) : null;
                const longitude = row.longitude ? parseFloat(row.longitude) : null;
                await this.prisma.subscription.create({
                    data: {
                        tenantId: tenant.id,
                        customerId: customer.id,
                        subscriptionNumber: row.subscriptionNumber,
                        subscriptionGroup: subscriptionGroup,
                        address: address,
                        addressCode: row.addressCode || null,
                        latitude: latitude || null,
                        longitude: longitude || null,
                        isActive: true,
                        startDate: new Date(),
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
        this.logger.log(`Bulk import: ${importedRows}/${rows.length} subscriptions imported`);
        return {
            success: errors.length === 0,
            totalRows: rows.length,
            importedRows,
            failedRows: rows.length - importedRows,
            errors,
        };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map