"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const constants_1 = require("../../../common/constants");
let UsersService = UsersService_1 = class UsersService {
    prisma;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, currentUser) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email already registered');
        }
        if (dto.tenants && dto.tenants.length > 0) {
            for (const assignment of dto.tenants) {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: assignment.tenantId },
                });
                if (!tenant) {
                    throw new common_1.BadRequestException(`Tenant ${assignment.tenantId} not found`);
                }
                if (currentUser.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
                    if (!tenant.path.startsWith(currentUser.tenantPath)) {
                        throw new common_1.ForbiddenException('You can only assign users to your tenant or descendants');
                    }
                }
            }
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                tcIdNo: dto.tcIdNo,
                passwordHash,
                language: dto.language || 'en',
                timezone: dto.timezone || 'UTC',
                tenants: dto.tenants
                    ? {
                        create: dto.tenants.map((t) => ({
                            tenantId: t.tenantId,
                            role: t.role,
                            permissions: t.permissions || [],
                        })),
                    }
                    : undefined,
            },
            include: {
                tenants: {
                    include: {
                        tenant: {
                            select: { id: true, name: true, path: true },
                        },
                    },
                },
            },
        });
        this.logger.log(`Created user: ${user.email}`);
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async findAll(query, currentUser) {
        const page = query.page || constants_1.PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(query.limit || constants_1.PAGINATION.DEFAULT_LIMIT, constants_1.PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (currentUser.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            whereClause.tenants = {
                some: {
                    tenant: {
                        path: {
                            startsWith: currentUser.tenantPath,
                        },
                    },
                },
            };
        }
        if (query.search) {
            whereClause.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.isActive !== undefined) {
            whereClause.isActive = query.isActive;
        }
        if (query.tenantId) {
            whereClause.tenants = {
                ...whereClause.tenants,
                some: {
                    ...whereClause.tenants?.some,
                    tenantId: query.tenantId,
                },
            };
        }
        if (query.role) {
            whereClause.tenants = {
                ...whereClause.tenants,
                some: {
                    ...whereClause.tenants?.some,
                    role: query.role,
                },
            };
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: {
                    [query.sortBy || 'lastName']: query.sortOrder || 'asc',
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    tenants: {
                        include: {
                            tenant: {
                                select: { id: true, name: true, path: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.user.count({ where: whereClause }),
        ]);
        return {
            data: users,
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
    async findOne(id, currentUser) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                tcIdNo: true,
                isActive: true,
                language: true,
                timezone: true,
                avatarUrl: true,
                lastLoginAt: true,
                lastLoginIp: true,
                createdAt: true,
                updatedAt: true,
                tenants: {
                    include: {
                        tenant: {
                            select: { id: true, name: true, path: true },
                        },
                    },
                },
                activityLogs: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        action: true,
                        resource: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (currentUser.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            const hasAccess = user.tenants.some((t) => t.tenant.path.startsWith(currentUser.tenantPath));
            if (!hasAccess) {
                throw new common_1.ForbiddenException('You do not have access to this user');
            }
        }
        return user;
    }
    async update(id, dto, currentUser) {
        await this.findOne(id, currentUser);
        if (dto.email) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    email: dto.email,
                    NOT: { id },
                },
            });
            if (existingUser) {
                throw new common_1.BadRequestException('Email already in use');
            }
        }
        if (dto.tenants && dto.tenants.length > 0) {
            for (const assignment of dto.tenants) {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: assignment.tenantId },
                });
                if (!tenant) {
                    throw new common_1.BadRequestException(`Tenant ${assignment.tenantId} not found`);
                }
                if (currentUser.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
                    if (!tenant.path.startsWith(currentUser.tenantPath)) {
                        throw new common_1.ForbiddenException('You can only assign users to your tenant or descendants');
                    }
                }
            }
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                tcIdNo: dto.tcIdNo,
                isActive: dto.isActive,
                language: dto.language,
                timezone: dto.timezone,
                avatarUrl: dto.avatarUrl,
            },
        });
        if (dto.tenants !== undefined) {
            await this.prisma.userTenant.deleteMany({
                where: { userId: id },
            });
            if (dto.tenants.length > 0) {
                await this.prisma.userTenant.createMany({
                    data: dto.tenants.map((t) => ({
                        userId: id,
                        tenantId: t.tenantId,
                        role: t.role,
                        permissions: t.permissions || [],
                    })),
                });
            }
        }
        const result = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                tcIdNo: true,
                isActive: true,
                language: true,
                timezone: true,
                avatarUrl: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                tenants: {
                    include: {
                        tenant: {
                            select: { id: true, name: true, path: true },
                        },
                    },
                },
            },
        });
        this.logger.log(`Updated user: ${updated.email}`);
        return result;
    }
    async delete(id, currentUser) {
        const user = await this.findOne(id, currentUser);
        if (id === currentUser.id) {
            throw new common_1.BadRequestException('Cannot delete your own account');
        }
        await this.prisma.userTenant.deleteMany({
            where: { userId: id },
        });
        await this.prisma.activityLog.deleteMany({
            where: { userId: id },
        });
        await this.prisma.refreshToken.deleteMany({
            where: { userId: id },
        });
        await this.prisma.user.delete({
            where: { id },
        });
        this.logger.log(`Deleted user: ${user.email}`);
    }
    async assignTenant(userId, dto, currentUser) {
        await this.findOne(userId, currentUser);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        if (currentUser.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            if (!tenant.path.startsWith(currentUser.tenantPath)) {
                throw new common_1.ForbiddenException('You can only assign users to your tenant or descendants');
            }
        }
        const assignment = await this.prisma.userTenant.upsert({
            where: {
                userId_tenantId: {
                    userId,
                    tenantId: dto.tenantId,
                },
            },
            update: {
                role: dto.role,
                permissions: dto.permissions || [],
            },
            create: {
                userId,
                tenantId: dto.tenantId,
                role: dto.role,
                permissions: dto.permissions || [],
            },
            include: {
                tenant: {
                    select: { id: true, name: true, path: true },
                },
            },
        });
        this.logger.log(`Assigned user ${userId} to tenant ${dto.tenantId} with role ${dto.role}`);
        return assignment;
    }
    async removeTenant(userId, tenantId, currentUser) {
        await this.findOne(userId, currentUser);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        if (currentUser.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            if (!tenant.path.startsWith(currentUser.tenantPath)) {
                throw new common_1.ForbiddenException('You can only manage users in your tenant or descendants');
            }
        }
        const userTenants = await this.prisma.userTenant.count({
            where: { userId },
        });
        if (userTenants <= 1) {
            throw new common_1.BadRequestException('User must have at least one tenant assignment');
        }
        await this.prisma.userTenant.delete({
            where: {
                userId_tenantId: {
                    userId,
                    tenantId,
                },
            },
        });
        this.logger.log(`Removed user ${userId} from tenant ${tenantId}`);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map