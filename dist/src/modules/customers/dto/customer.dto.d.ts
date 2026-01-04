export declare enum CustomerType {
    INDIVIDUAL = "INDIVIDUAL",
    ORGANIZATIONAL = "ORGANIZATIONAL"
}
export declare class CreateCustomerDto {
    tenantId: string;
    customerNumber?: string;
    customerType: CustomerType;
    details: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export declare class UpdateCustomerDto {
    customerNumber?: string;
    customerType?: CustomerType;
    details?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export declare class CustomerQueryDto {
    page?: number;
    limit?: number;
    tenantId?: string;
    customerType?: CustomerType;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class BulkImportCustomersDto {
    rows: Record<string, string>[];
}
export declare class ExportCustomersQueryDto extends CustomerQueryDto {
    limit?: number;
}
