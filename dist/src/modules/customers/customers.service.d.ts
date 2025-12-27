import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { AuthenticatedUser } from '../../common/interfaces';
export interface CustomerData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    customerType: string;
    details: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    tenant?: {
        id: string;
        name: string;
        path: string;
    };
    subscriptions?: Array<{
        id: string;
        subscriptionType: string;
        subscriptionGroup: string;
        address: Record<string, unknown>;
        isActive: boolean;
    }>;
    _count?: {
        subscriptions: number;
    };
}
export interface PaginatedCustomers {
    data: CustomerData[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface CustomersQueryParams {
    page?: number;
    limit?: number;
    tenantId?: string;
    customerType?: string;
    search?: string;
}
export { CreateCustomerDto, UpdateCustomerDto };
export declare class CustomersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private hasUserAccessToTenant;
    private getEffectiveTenantPath;
    getCustomers(params: CustomersQueryParams, user: AuthenticatedUser): Promise<PaginatedCustomers>;
    getCustomer(id: string, user: AuthenticatedUser): Promise<CustomerData>;
    private generateCustomerNumber;
    createCustomer(dto: CreateCustomerDto, user: AuthenticatedUser): Promise<CustomerData>;
    updateCustomer(id: string, dto: UpdateCustomerDto, user: AuthenticatedUser): Promise<CustomerData>;
    deleteCustomer(id: string, user: AuthenticatedUser): Promise<void>;
    private mapCustomer;
}
