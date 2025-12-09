import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignTenantDto, UserQueryDto } from './dto/user.dto';
import type { AuthenticatedUser } from '../../../common/interfaces';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto, user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        language: string;
        timezone: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        tcIdNo: string | null;
        passwordHash: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
        avatarUrl: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    findAll(query: UserQueryDto, user: AuthenticatedUser): Promise<import("../../../common/interfaces").PaginatedResult<any>>;
    findOne(id: string, user: AuthenticatedUser): Promise<any>;
    update(id: string, dto: UpdateUserDto, user: AuthenticatedUser): Promise<any>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
    assignTenant(userId: string, dto: AssignTenantDto, user: AuthenticatedUser): Promise<any>;
    removeTenant(userId: string, tenantId: string, user: AuthenticatedUser): Promise<void>;
}
