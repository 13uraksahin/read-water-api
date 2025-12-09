import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignTenantDto, UserQueryDto } from './dto/user.dto';
import { AuthenticatedUser, PaginatedResult } from '../../../common/interfaces';
import { User } from '@prisma/client';
export declare class UsersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto, currentUser: AuthenticatedUser): Promise<User>;
    findAll(query: UserQueryDto, currentUser: AuthenticatedUser): Promise<PaginatedResult<any>>;
    findOne(id: string, currentUser: AuthenticatedUser): Promise<any>;
    update(id: string, dto: UpdateUserDto, currentUser: AuthenticatedUser): Promise<any>;
    delete(id: string, currentUser: AuthenticatedUser): Promise<void>;
    assignTenant(userId: string, dto: AssignTenantDto, currentUser: AuthenticatedUser): Promise<any>;
    removeTenant(userId: string, tenantId: string, currentUser: AuthenticatedUser): Promise<void>;
}
