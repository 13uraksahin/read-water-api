import { CustomersService } from './customers.service';
import type { PaginatedCustomers, CustomerData } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import type { AuthenticatedUser } from '../../common/interfaces';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    getCustomers(user: AuthenticatedUser, page?: string, limit?: string, tenantId?: string, customerType?: string, search?: string): Promise<PaginatedCustomers>;
    getCustomer(user: AuthenticatedUser, id: string): Promise<CustomerData>;
    createCustomer(user: AuthenticatedUser, dto: CreateCustomerDto): Promise<CustomerData>;
    updateCustomer(user: AuthenticatedUser, id: string, dto: UpdateCustomerDto): Promise<CustomerData>;
    patchCustomer(user: AuthenticatedUser, id: string, dto: UpdateCustomerDto): Promise<CustomerData>;
    deleteCustomer(user: AuthenticatedUser, id: string): Promise<void>;
}
