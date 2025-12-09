import { SystemRole } from '@prisma/client';
declare class TenantAssignmentDto {
    tenantId: string;
    role: SystemRole;
    permissions?: string[];
}
export declare class CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    tcIdNo?: string;
    language?: string;
    timezone?: string;
    tenants?: TenantAssignmentDto[];
}
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    tcIdNo?: string;
    isActive?: boolean;
    language?: string;
    timezone?: string;
    avatarUrl?: string;
}
export declare class AssignTenantDto {
    tenantId: string;
    role: SystemRole;
    permissions?: string[];
}
export declare class UserQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    tenantId?: string;
    role?: SystemRole;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export {};
