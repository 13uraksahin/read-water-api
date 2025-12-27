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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const redis_service_1 = require("../../../core/redis/redis.service");
const constants_1 = require("../../../common/constants");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    redisService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, configService, redisService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redisService = redisService;
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                tenants: {
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                path: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is disabled');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.tenants.length) {
            throw new common_1.UnauthorizedException('User has no tenant assignment');
        }
        const userTenant = this.getPrimaryTenant(user.tenants);
        const primaryPermissions = this.resolvePermissions(userTenant.role, userTenant.permissions);
        const tenantAssignments = user.tenants.map((ut) => ({
            tenantId: ut.tenantId,
            tenantName: ut.tenant.name,
            tenantPath: ut.tenant.path,
            role: ut.role,
            permissions: this.resolvePermissions(ut.role, ut.permissions),
        }));
        const tokens = await this.generateTokens(user.id, user.email, userTenant.tenantId);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
            },
        });
        await this.prisma.activityLog.create({
            data: {
                userId: user.id,
                action: 'user.login',
                resource: 'auth',
                details: { email: user.email },
            },
        });
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tenantId: userTenant.tenantId,
                role: userTenant.role,
                permissions: primaryPermissions,
                tenants: tenantAssignments,
            },
        };
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Email already registered');
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Invalid tenant');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                tenants: {
                    create: {
                        tenantId: dto.tenantId,
                        role: constants_1.SYSTEM_ROLES.VIEWER,
                    },
                },
            },
            include: {
                tenants: {
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                path: true,
                            },
                        },
                    },
                },
            },
        });
        const userTenant = user.tenants[0];
        const permissions = this.resolvePermissions(userTenant.role, userTenant.permissions);
        const tenantAssignments = user.tenants.map((ut) => ({
            tenantId: ut.tenantId,
            tenantName: ut.tenant.name,
            tenantPath: ut.tenant.path,
            role: ut.role,
            permissions: this.resolvePermissions(ut.role, ut.permissions),
        }));
        const tokens = await this.generateTokens(user.id, user.email, userTenant.tenantId);
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tenantId: userTenant.tenantId,
                role: userTenant.role,
                permissions,
                tenants: tenantAssignments,
            },
        };
    }
    async refreshToken(dto) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: dto.refreshToken },
        });
        if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: storedToken.userId },
            include: {
                tenants: {
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                path: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        if (!user.tenants.length) {
            throw new common_1.UnauthorizedException('User has no tenant assignment');
        }
        const userTenant = this.getPrimaryTenant(user.tenants);
        const permissions = this.resolvePermissions(userTenant.role, userTenant.permissions);
        const tenantAssignments = user.tenants.map((ut) => ({
            tenantId: ut.tenantId,
            tenantName: ut.tenant.name,
            tenantPath: ut.tenant.path,
            role: ut.role,
            permissions: this.resolvePermissions(ut.role, ut.permissions),
        }));
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });
        const tokens = await this.generateTokens(user.id, user.email, userTenant.tenantId);
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                tenantId: userTenant.tenantId,
                role: userTenant.role,
                permissions,
                tenants: tenantAssignments,
            },
        };
    }
    async logout(userId, refreshToken) {
        if (refreshToken) {
            await this.prisma.refreshToken.updateMany({
                where: { userId, token: refreshToken },
                data: { revokedAt: new Date() },
            });
        }
        else {
            await this.prisma.refreshToken.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        await this.redisService.del(constants_1.CACHE_KEYS.USER_SESSION(userId));
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenants: {
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                path: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            tenants: user.tenants.map((ut) => ({
                tenantId: ut.tenantId,
                tenantName: ut.tenant.name,
                tenantPath: ut.tenant.path,
                role: ut.role,
            })),
        };
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const passwordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async generateTokens(userId, email, tenantId) {
        const payload = {
            sub: userId,
            email,
            tenantId,
        };
        const expiresIn = this.configService.get('JWT_EXPIRES_IN', '7d');
        const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d');
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: expiresIn,
        });
        const refreshToken = (0, uuid_1.v4)();
        const refreshExpiresAt = new Date();
        refreshExpiresAt.setDate(refreshExpiresAt.getDate() + parseInt(refreshExpiresIn.replace('d', ''), 10));
        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: refreshToken,
                expiresAt: refreshExpiresAt,
            },
        });
        const expiresInSeconds = this.parseExpiry(expiresIn);
        return {
            accessToken,
            refreshToken,
            expiresIn: expiresInSeconds,
        };
    }
    parseExpiry(expiry) {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match)
            return 3600;
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return 3600;
        }
    }
    resolvePermissions(role, customPermissions = []) {
        const rolePermissions = (0, constants_1.getPermissionsForRole)(role);
        return [...new Set([...rolePermissions, ...customPermissions])];
    }
    getPrimaryTenant(tenants) {
        const rolePriority = [
            constants_1.SYSTEM_ROLES.PLATFORM_ADMIN,
            constants_1.SYSTEM_ROLES.TENANT_ADMIN,
            constants_1.SYSTEM_ROLES.OPERATOR,
            constants_1.SYSTEM_ROLES.FIELD_ENGINEER,
            constants_1.SYSTEM_ROLES.VIEWER,
            constants_1.SYSTEM_ROLES.CUSTOMER,
        ];
        return tenants.reduce((best, current) => {
            const bestIndex = rolePriority.indexOf(best.role);
            const currentIndex = rolePriority.indexOf(current.role);
            return currentIndex < bestIndex ? current : best;
        }, tenants[0]);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map