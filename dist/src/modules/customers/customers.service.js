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
let CustomersService = CustomersService_1 = class CustomersService {
    prisma;
    logger = new common_1.Logger(CustomersService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCustomers(params) {
        const page = params.page ?? 1;
        const limit = Math.min(params.limit ?? 30, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (params.tenantId) {
            where.tenantId = params.tenantId;
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
    async getCustomer(id) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
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
        return this.mapCustomer(customer);
    }
    async createCustomer(dto) {
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
    async updateCustomer(id, dto) {
        const existing = await this.prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
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
    async deleteCustomer(id) {
        const existing = await this.prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        }
        await this.prisma.customer.delete({ where: { id } });
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