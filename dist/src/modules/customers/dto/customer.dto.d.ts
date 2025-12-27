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
