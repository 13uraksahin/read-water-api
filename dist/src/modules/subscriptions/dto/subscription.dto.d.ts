export declare enum SubscriptionType {
    INDIVIDUAL = "INDIVIDUAL",
    ORGANIZATIONAL = "ORGANIZATIONAL"
}
export declare enum SubscriptionGroup {
    NORMAL_CONSUMPTION = "NORMAL_CONSUMPTION",
    HIGH_CONSUMPTION = "HIGH_CONSUMPTION"
}
declare class AddressDto {
    city?: string;
    district?: string;
    neighborhood?: string;
    street?: string;
    buildingNo?: string;
    floor?: string;
    doorNo?: string;
    postalCode?: string;
    addressCode?: string;
    extraDetails?: string;
}
export declare class CreateSubscriptionDto {
    tenantId: string;
    subscriptionNumber?: string;
    customerId: string;
    subscriptionType: SubscriptionType;
    subscriptionGroup?: SubscriptionGroup;
    address: AddressDto;
    addressCode?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    metadata?: Record<string, unknown>;
}
export declare class UpdateSubscriptionDto {
    subscriptionNumber?: string;
    subscriptionType?: SubscriptionType;
    subscriptionGroup?: SubscriptionGroup;
    address?: AddressDto;
    addressCode?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
    endDate?: string;
    metadata?: Record<string, unknown>;
}
export declare class SubscriptionQueryDto {
    page?: number;
    limit?: number;
    tenantId?: string;
    customerId?: string;
    isActive?: boolean;
    subscriptionType?: SubscriptionType;
    subscriptionGroup?: SubscriptionGroup;
    search?: string;
}
export {};
