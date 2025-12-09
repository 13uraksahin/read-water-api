import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export interface CustomerData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    customerType: string;
    consumptionType: string;
    details: Record<string, unknown>;
    address: Record<string, unknown>;
    addressCode: string | null;
    latitude: number | null;
    longitude: number | null;
    metadata: Record<string, unknown> | null;
    meters?: Array<{
        id: string;
        serialNumber: string;
        status: string;
    }>;
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
    getCustomers(params: CustomersQueryParams): Promise<PaginatedCustomers>;
    getCustomer(id: string): Promise<CustomerData>;
    createCustomer(dto: CreateCustomerDto): Promise<CustomerData>;
    updateCustomer(id: string, dto: UpdateCustomerDto): Promise<CustomerData>;
    deleteCustomer(id: string): Promise<void>;
    private mapCustomer;
}
