export declare enum CustomerType {
    INDIVIDUAL = "INDIVIDUAL",
    ORGANIZATIONAL = "ORGANIZATIONAL"
}
export declare enum ConsumptionType {
    NORMAL = "NORMAL",
    HIGH = "HIGH"
}
export declare class CreateCustomerDto {
    tenantId: string;
    customerType: CustomerType;
    consumptionType?: ConsumptionType;
    details: Record<string, unknown>;
    address: Record<string, unknown>;
    addressCode?: string;
    latitude?: number;
    longitude?: number;
    metadata?: Record<string, unknown>;
}
export declare class UpdateCustomerDto {
    customerType?: CustomerType;
    consumptionType?: ConsumptionType;
    details?: Record<string, unknown>;
    address?: Record<string, unknown>;
    addressCode?: string;
    latitude?: number;
    longitude?: number;
    metadata?: Record<string, unknown>;
}
