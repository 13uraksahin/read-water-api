import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto, AuthResponseDto } from './dto/auth.dto';
import type { AuthenticatedUser } from '../../../common/interfaces';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<AuthResponseDto>;
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto>;
    logout(user: AuthenticatedUser, refreshToken?: string): Promise<void>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<void>;
    me(user: AuthenticatedUser): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        lastLoginAt: Date | null;
        tenants: {
            tenantId: string;
            tenantName: string;
            tenantPath: string;
            role: import("@prisma/client").$Enums.SystemRole;
        }[];
    }>;
}
