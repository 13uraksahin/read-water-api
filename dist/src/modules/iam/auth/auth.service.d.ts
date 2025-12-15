import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { LoginDto, RegisterDto, RefreshTokenDto, ChangePasswordDto, AuthResponseDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly redisService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, redisService: RedisService);
    login(dto: LoginDto): Promise<AuthResponseDto>;
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto>;
    logout(userId: string, refreshToken?: string): Promise<void>;
    getCurrentUser(userId: string): Promise<{
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
    changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
    private generateTokens;
    private parseExpiry;
}
