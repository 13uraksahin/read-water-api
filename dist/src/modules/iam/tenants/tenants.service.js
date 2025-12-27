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
var TenantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const kysely_service_1 = require("../../../core/kysely/kysely.service");
const constants_1 = require("../../../common/constants");
let TenantsService = TenantsService_1 = class TenantsService {
    prisma;
    kysely;
    logger = new common_1.Logger(TenantsService_1.name);
    constructor(prisma, kysely) {
        this.prisma = prisma;
        this.kysely = kysely;
    }
    async create(dto, user) {
        if (!dto.parentId && user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            throw new common_1.ForbiddenException('Only Platform Admin can create root-level tenants');
        }
        let parentPath = '';
        if (dto.parentId) {
            const parent = await this.prisma.tenant.findUnique({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent tenant not found');
            }
            const hasAccess = await this.hasAccessToTenant(user, parent.path, parent.id);
            if (!hasAccess) {
                throw new common_1.ForbiddenException('You do not have access to this parent tenant');
            }
            parentPath = parent.path;
        }
        const sanitizedName = this.sanitizeForLtree(dto.name);
        const path = parentPath ? `${parentPath}.${sanitizedName}` : sanitizedName;
        const existingTenant = await this.prisma.tenant.findUnique({
            where: { path },
        });
        if (existingTenant) {
            throw new common_1.BadRequestException('A tenant with this name already exists at this level');
        }
        const tenant = await this.prisma.tenant.create({
            data: {
                path,
                name: dto.name,
                parentId: dto.parentId,
                contactFirstName: dto.contactFirstName,
                contactLastName: dto.contactLastName,
                contactPhone: dto.contactPhone,
                contactEmail: dto.contactEmail,
                taxId: dto.taxId,
                taxOffice: dto.taxOffice,
                address: dto.address,
                latitude: dto.latitude,
                longitude: dto.longitude,
                tenantSubscriptionStatus: dto.tenantSubscriptionStatus,
                subscriptionPlan: dto.subscriptionPlan,
                settings: dto.settings,
                allowedProfiles: dto.allowedProfileIds
                    ? {
                        connect: dto.allowedProfileIds.map((id) => ({ id })),
                    }
                    : undefined,
                allowedDeviceProfiles: dto.allowedDeviceProfileIds
                    ? {
                        connect: dto.allowedDeviceProfileIds.map((id) => ({ id })),
                    }
                    : undefined,
            },
            include: {
                parent: true,
                allowedProfiles: true,
                allowedDeviceProfiles: true,
                _count: {
                    select: {
                        users: true,
                        meters: true,
                        children: true,
                    },
                },
            },
        });
        this.logger.log(`Created tenant: ${tenant.name} (${tenant.path})`);
        return tenant;
    }
    async findAll(query, user) {
        const page = query.page || constants_1.PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        let whereClause = {};
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            const userTenantAssignments = await this.prisma.userTenant.findMany({
                where: { userId: user.id },
                select: { tenantId: true, tenant: { select: { path: true } } },
            });
            const assignedTenantIds = userTenantAssignments.map(ut => ut.tenantId);
            const assignedPaths = userTenantAssignments.map(ut => ut.tenant.path);
            whereClause.OR = [
                { id: { in: assignedTenantIds } },
                { path: { startsWith: user.tenantPath } },
                ...assignedPaths.map(path => ({ path: { startsWith: path } })),
            ];
        }
        const additionalFilters = {};
        if (query.search) {
            additionalFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { contactEmail: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.tenantSubscriptionStatus) {
            additionalFilters.tenantSubscriptionStatus = query.tenantSubscriptionStatus;
        }
        if (query.parentId) {
            additionalFilters.parentId = query.parentId;
        }
        const finalWhereClause = whereClause.OR
            ? { AND: [whereClause, additionalFilters] }
            : { ...whereClause, ...additionalFilters };
        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where: finalWhereClause,
                skip,
                take: limit,
                orderBy: {
                    [query.sortBy || 'name']: query.sortOrder || 'asc',
                },
                include: {
                    parent: {
                        select: { id: true, name: true, path: true },
                    },
                    _count: {
                        select: {
                            users: true,
                            meters: true,
                            children: true,
                            customers: true,
                        },
                    },
                },
            }),
            this.prisma.tenant.count({ where: finalWhereClause }),
        ]);
        return {
            data: tenants,
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
    async getTree(user) {
        const basePath = user.role === constants_1.SYSTEM_ROLES.PLATFORM_ADMIN ? '' : user.tenantPath;
        const descendants = await this.kysely.getDescendantTenants(basePath || 'Root');
        const tenantMap = new Map();
        const roots = [];
        for (const tenant of descendants) {
            tenantMap.set(tenant.path, {
                ...tenant,
                children: [],
            });
        }
        for (const tenant of descendants) {
            const node = tenantMap.get(tenant.path);
            const pathParts = tenant.path.split('.');
            if (pathParts.length === 1 || (basePath && tenant.path === basePath)) {
                roots.push(node);
            }
            else {
                const parentPath = pathParts.slice(0, -1).join('.');
                const parent = tenantMap.get(parentPath);
                if (parent) {
                    parent.children.push(node);
                }
                else {
                    roots.push(node);
                }
            }
        }
        return roots;
    }
    async findOne(id, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                parent: {
                    select: { id: true, name: true, path: true },
                },
                children: {
                    select: { id: true, name: true, path: true },
                },
                allowedProfiles: true,
                allowedDeviceProfiles: true,
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        meters: true,
                        customers: true,
                        alarms: {
                            where: { status: 'ACTIVE' },
                        },
                    },
                },
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const hasAccess = await this.hasAccessToTenant(user, tenant.path, tenant.id);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this tenant');
        }
        return tenant;
    }
    async update(id, dto, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const hasAccess = await this.hasAccessToTenant(user, tenant.path, tenant.id);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this tenant');
        }
        const updated = await this.prisma.tenant.update({
            where: { id },
            data: {
                name: dto.name,
                contactFirstName: dto.contactFirstName,
                contactLastName: dto.contactLastName,
                contactPhone: dto.contactPhone,
                contactEmail: dto.contactEmail,
                taxId: dto.taxId,
                taxOffice: dto.taxOffice,
                address: dto.address,
                latitude: dto.latitude,
                longitude: dto.longitude,
                tenantSubscriptionStatus: dto.tenantSubscriptionStatus,
                subscriptionPlan: dto.subscriptionPlan,
                settings: dto.settings,
                allowedProfiles: dto.allowedProfileIds
                    ? {
                        set: dto.allowedProfileIds.map((profileId) => ({ id: profileId })),
                    }
                    : undefined,
                allowedDeviceProfiles: dto.allowedDeviceProfileIds
                    ? {
                        set: dto.allowedDeviceProfileIds.map((profileId) => ({ id: profileId })),
                    }
                    : undefined,
            },
            include: {
                parent: true,
                allowedProfiles: true,
                allowedDeviceProfiles: true,
                _count: {
                    select: {
                        users: true,
                        meters: true,
                        children: true,
                    },
                },
            },
        });
        this.logger.log(`Updated tenant: ${updated.name} (${updated.path})`);
        return updated;
    }
    async delete(id, user) {
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            throw new common_1.ForbiddenException('Only Platform Admin can delete tenants');
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        children: true,
                        meters: true,
                        customers: true,
                        users: true,
                    },
                },
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        if (tenant._count.children > 0 ||
            tenant._count.meters > 0 ||
            tenant._count.customers > 0) {
            throw new common_1.BadRequestException('Cannot delete tenant with child tenants, meters, or customers. Please remove them first.');
        }
        await this.prisma.userTenant.deleteMany({
            where: { tenantId: id },
        });
        await this.prisma.tenant.delete({
            where: { id },
        });
        this.logger.log(`Deleted tenant: ${tenant.name} (${tenant.path})`);
    }
    async getStats(id, user) {
        const tenant = await this.findOne(id, user);
        const descendants = await this.kysely.getDescendantTenants(tenant.path);
        const tenantIds = descendants.map((t) => t.id);
        const [meterCount, customerCount, activeAlarms, readingStats] = await Promise.all([
            this.prisma.meter.count({
                where: { tenantId: { in: tenantIds } },
            }),
            this.prisma.customer.count({
                where: { tenantId: { in: tenantIds } },
            }),
            this.prisma.alarm.count({
                where: {
                    tenantId: { in: tenantIds },
                    status: 'ACTIVE',
                },
            }),
            this.kysely.getConsumptionStats(tenant.id, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
        ]);
        return {
            tenant: {
                id: tenant.id,
                name: tenant.name,
                path: tenant.path,
            },
            stats: {
                totalMeters: meterCount,
                totalCustomers: customerCount,
                activeAlarms,
                childTenants: descendants.length - 1,
                ...readingStats,
            },
        };
    }
    async hasAccessToTenant(user, tenantPath, tenantId) {
        if (user.role === constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            return true;
        }
        if (tenantPath.startsWith(user.tenantPath) || user.tenantPath.startsWith(tenantPath)) {
            return true;
        }
        if (tenantId) {
            const directAssignment = await this.prisma.userTenant.findFirst({
                where: {
                    userId: user.id,
                    tenantId: tenantId,
                },
            });
            return !!directAssignment;
        }
        return false;
    }
    sanitizeForLtree(name) {
        return name
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_');
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = TenantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kysely_service_1.KyselyService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map