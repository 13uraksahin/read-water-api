import { CustomersService } from './customers.service';
import type { PaginatedCustomers, CustomerData } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, BulkImportCustomersDto, ExportCustomersQueryDto } from './dto/customer.dto';
import type { AuthenticatedUser } from '../../common/interfaces';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    getCustomers(user: AuthenticatedUser, page?: string, limit?: string, tenantId?: string, customerType?: string, search?: string): Promise<PaginatedCustomers>;
    exportCustomers(user: AuthenticatedUser, query: ExportCustomersQueryDto): Promise<PaginatedCustomers>;
    bulkImport(user: AuthenticatedUser, dto: BulkImportCustomersDto): Promise<{
        success: boolean;
        totalRows: number;
        importedRows: number;
        failedRows: number;
        errors: Array<{
            row: number;
            field: string;
            message: string;
        }>;
    }>;
    getCustomer(user: AuthenticatedUser, id: string): Promise<CustomerData>;
    createCustomer(user: AuthenticatedUser, dto: CreateCustomerDto): Promise<CustomerData>;
    updateCustomer(user: AuthenticatedUser, id: string, dto: UpdateCustomerDto): Promise<CustomerData>;
    patchCustomer(user: AuthenticatedUser, id: string, dto: UpdateCustomerDto): Promise<CustomerData>;
    deleteCustomer(user: AuthenticatedUser, id: string): Promise<void>;
}
