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
var CustomersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = exports.UpdateCustomerDto = exports.CreateCustomerDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const customer_dto_1 = require("./dto/customer.dto");
Object.defineProperty(exports, "CreateCustomerDto", { enumerable: true, get: function () { return customer_dto_1.CreateCustomerDto; } });
Object.defineProperty(exports, "UpdateCustomerDto", { enumerable: true, get: function () { return customer_dto_1.UpdateCustomerDto; } });
const constants_1 = require("../../common/constants");
let CustomersService = CustomersService_1 = class CustomersService {
    prisma;
    logger = new common_1.Logger(CustomersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getEffectiveTenantPath(user, tenantId) {
        if (tenantId) {
            const selectedTenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { path: true },
            });
            if (!selectedTenant) {
                return user.tenantPath;
            }
            if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
                if (!selectedTenant.path.startsWith(user.tenantPath)) {
                    return user.tenantPath;
                }
            }
            return selectedTenant.path;
        }
        if (user.role === constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            return null;
        }
        return user.tenantPath;
    }
    async getCustomers(params, user) {
        const page = params.page ?? 1;
        const limit = Math.min(params.limit ?? 30, 100);
        const skip = (page - 1) * limit;
        const where = {};
        const effectivePath = await this.getEffectiveTenantPath(user, params.tenantId);
        if (effectivePath) {
            where.tenant = {
                path: {
                    startsWith: effectivePath,
                },
            };
        }
        if (params.customerType) {
            where.customerType = params.customerType;
        }
        if (params.search) {
            where.OR = [
                {
                    details: {
                        path: ['firstName'],
                        string_contains: params.search,
                    },
                },
                {
                    details: {
                        path: ['lastName'],
                        string_contains: params.search,
                    },
                },
                {
                    details: {
                        path: ['organizationName'],
                        string_contains: params.search,
                    },
                },
            ];
        }
        const [total, customers] = await Promise.all([
            this.prisma.customer.count({ where }),
            this.prisma.customer.findMany({
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
                    meters: {
                        select: {
                            id: true,
                            serialNumber: true,
                            status: true,
                        },
                    },
                },
            }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: customers.map((c) => this.mapCustomer(c)),
            meta: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    }
    async getCustomer(id, user) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        path: true,
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
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        }
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            if (!customer.tenant.path.startsWith(user.tenantPath)) {
                throw new common_1.ForbiddenException('You do not have access to this customer');
            }
        }
        return this.mapCustomer(customer);
    }
    async createCustomer(dto, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            if (!tenant.path.startsWith(user.tenantPath)) {
                throw new common_1.ForbiddenException('You do not have access to create customers in this tenant');
            }
        }
        const customer = await this.prisma.customer.create({
            data: {
                tenantId: dto.tenantId,
                customerType: dto.customerType,
                consumptionType: (dto.consumptionType || 'NORMAL'),
                details: dto.details,
                address: dto.address,
                addressCode: dto.addressCode,
                latitude: dto.latitude,
                longitude: dto.longitude,
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
                meters: {
                    select: {
                        id: true,
                        serialNumber: true,
                        status: true,
                    },
                },
            },
        });
        this.logger.log(`Created customer in tenant ${tenant.name}`);
        return this.mapCustomer(customer);
    }
    async updateCustomer(id, dto, user) {
        const existing = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                tenant: {
                    select: { id: true, name: true, path: true },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        }
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            if (!existing.tenant.path.startsWith(user.tenantPath)) {
                throw new common_1.ForbiddenException('You do not have access to update this customer');
            }
        }
        const customer = await this.prisma.customer.update({
            where: { id },
            data: {
                ...(dto.customerType && { customerType: dto.customerType }),
                ...(dto.consumptionType && { consumptionType: dto.consumptionType }),
                ...(dto.details && { details: dto.details }),
                ...(dto.address && { address: dto.address }),
                ...(dto.addressCode !== undefined && { addressCode: dto.addressCode }),
                ...(dto.latitude !== undefined && { latitude: dto.latitude }),
                ...(dto.longitude !== undefined && { longitude: dto.longitude }),
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
                meters: {
                    select: {
                        id: true,
                        serialNumber: true,
                        status: true,
                    },
                },
            },
        });
        return this.mapCustomer(customer);
    }
    async deleteCustomer(id, user) {
        const existing = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                tenant: {
                    select: { id: true, name: true, path: true },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        }
        if (user.role !== constants_1.SYSTEM_ROLES.PLATFORM_ADMIN) {
            if (!existing.tenant.path.startsWith(user.tenantPath)) {
                throw new common_1.ForbiddenException('You do not have access to delete this customer');
            }
        }
        await this.prisma.customer.delete({ where: { id } });
        this.logger.log(`Deleted customer ${id} from tenant ${existing.tenant.name}`);
    }
    mapCustomer(customer) {
        return {
            id: customer.id,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
            tenantId: customer.tenantId,
            customerType: customer.customerType,
            consumptionType: customer.consumptionType,
            details: customer.details,
            address: customer.address,
            addressCode: customer.addressCode,
            latitude: customer.latitude ? Number(customer.latitude) : null,
            longitude: customer.longitude ? Number(customer.longitude) : null,
            metadata: customer.metadata,
            tenant: customer.tenant,
            meters: customer.meters,
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = CustomersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map