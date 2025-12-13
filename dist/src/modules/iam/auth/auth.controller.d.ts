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
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        phone: any;
        isActive: any;
        createdAt: any;
        lastLoginAt: any;
        tenants: any;
    }>;
}
