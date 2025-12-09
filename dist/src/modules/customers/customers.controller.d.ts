import { CustomersService } from './customers.service';
import type { PaginatedCustomers, CustomerData } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    getCustomers(page?: string, limit?: string, tenantId?: string, customerType?: string, search?: string): Promise<PaginatedCustomers>;
    getCustomer(id: string): Promise<CustomerData>;
    createCustomer(dto: CreateCustomerDto): Promise<CustomerData>;
    updateCustomer(id: string, dto: UpdateCustomerDto): Promise<CustomerData>;
    deleteCustomer(id: string): Promise<void>;
}
