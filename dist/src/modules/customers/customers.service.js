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
                {
                    details: {
                        path: ['tcIdNo'],
                        string_contains: params.search,
                    },
                },
                {
                    details: {
                        path: ['taxId'],
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
                    subscriptions: {
                        select: {
                            id: true,
                            subscriptionGroup: true,
                            address: true,
                            isActive: true,
                        },
                    },
                    _count: {
                        select: {
                            subscriptions: true,
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
                subscriptions: {
                    include: {
                        meters: {
                            select: {
                                id: true,
                                serialNumber: true,
                                status: true,
                                lastReadingValue: true,
                                lastReadingTime: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        subscriptions: true,
                    },
                },
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        }
        const hasAccess = await this.hasUserAccessToTenant(user, customer.tenant.path, customer.tenantId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to this customer');
        }
        return this.mapCustomer(customer);
    }
    async generateCustomerNumber(tenantId) {
        const count = await this.prisma.customer.count({
            where: { tenantId },
        });
        const timestamp = Date.now().toString(36).toUpperCase();
        return `C-${(count + 1).toString().padStart(6, '0')}-${timestamp}`;
    }
    async createCustomer(dto, user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const hasAccess = await this.hasUserAccessToTenant(user, tenant.path, tenant.id);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to create customers in this tenant');
        }
        const customerNumber = dto.customerNumber || await this.generateCustomerNumber(dto.tenantId);
        const customer = await this.prisma.customer.create({
            data: {
                tenantId: dto.tenantId,
                customerNumber,
                customerType: dto.customerType,
                details: dto.details,
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
                subscriptions: {
                    select: {
                        id: true,
                        subscriptionGroup: true,
                        address: true,
                        isActive: true,
                    },
                },
                _count: {
                    select: {
                        subscriptions: true,
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
        const hasAccess = await this.hasUserAccessToTenant(user, existing.tenant.path, existing.tenantId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to update this customer');
        }
        const customer = await this.prisma.customer.update({
            where: { id },
            data: {
                ...(dto.customerType && { customerType: dto.customerType }),
                ...(dto.details && { details: dto.details }),
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
                subscriptions: {
                    select: {
                        id: true,
                        subscriptionGroup: true,
                        address: true,
                        isActive: true,
                    },
                },
                _count: {
                    select: {
                        subscriptions: true,
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
                _count: {
                    select: {
                        subscriptions: true,
                    },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Customer with ID ${id} not found`);
        }
        const hasAccess = await this.hasUserAccessToTenant(user, existing.tenant.path, existing.tenantId);
        if (!hasAccess) {
            throw new common_1.ForbiddenException('You do not have access to delete this customer');
        }
        if (existing._count.subscriptions > 0) {
            throw new common_1.ForbiddenException(`Cannot delete customer with ${existing._count.subscriptions} subscriptions. Delete subscriptions first.`);
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
            details: customer.details,
            metadata: customer.metadata,
            tenant: customer.tenant,
            subscriptions: customer.subscriptions,
            _count: customer._count,
        };
    }
    async exportCustomers(query, user) {
        const MAX_EXPORT_LIMIT = 10000;
        const limit = Math.min(query.limit || MAX_EXPORT_LIMIT, MAX_EXPORT_LIMIT);
        return this.getCustomers({ ...query, page: 1, limit }, user);
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
                if (!row.customerNumber) {
                    errors.push({
                        row: rowNumber,
                        field: 'customerNumber',
                        message: 'Customer number is required',
                    });
                    continue;
                }
                if (!row.customerType || !['INDIVIDUAL', 'ORGANIZATIONAL'].includes(row.customerType)) {
                    errors.push({
                        row: rowNumber,
                        field: 'customerType',
                        message: 'Customer type must be INDIVIDUAL or ORGANIZATIONAL',
                    });
                    continue;
                }
                const existingCustomer = await this.prisma.customer.findFirst({
                    where: {
                        tenantId: tenant.id,
                        customerNumber: row.customerNumber,
                    },
                });
                if (existingCustomer) {
                    errors.push({
                        row: rowNumber,
                        field: 'customerNumber',
                        message: `Customer number "${row.customerNumber}" already exists`,
                    });
                    continue;
                }
                const details = {};
                if (row.customerType === 'INDIVIDUAL') {
                    if (row.firstName)
                        details.firstName = row.firstName;
                    if (row.lastName)
                        details.lastName = row.lastName;
                    if (row.tcIdNo)
                        details.tcIdNo = row.tcIdNo;
                    if (row.phone)
                        details.phone = row.phone;
                    if (row.email)
                        details.email = row.email;
                }
                else {
                    if (row.organizationName)
                        details.organizationName = row.organizationName;
                    if (row.taxId)
                        details.taxId = row.taxId;
                    if (row.taxOffice)
                        details.taxOffice = row.taxOffice;
                    if (row.contactFirstName)
                        details.contactFirstName = row.contactFirstName;
                    if (row.contactLastName)
                        details.contactLastName = row.contactLastName;
                    if (row.contactPhone)
                        details.contactPhone = row.contactPhone;
                    if (row.contactEmail)
                        details.contactEmail = row.contactEmail;
                }
                await this.prisma.customer.create({
                    data: {
                        tenantId: tenant.id,
                        customerNumber: row.customerNumber,
                        customerType: row.customerType,
                        details: details,
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
        this.logger.log(`Bulk import: ${importedRows}/${rows.length} customers imported`);
        return {
            success: errors.length === 0,
            totalRows: rows.length,
            importedRows,
            failedRows: rows.length - importedRows,
            errors,
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = CustomersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map