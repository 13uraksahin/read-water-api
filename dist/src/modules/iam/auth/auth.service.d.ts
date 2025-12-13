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
    changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
    private generateTokens;
    private parseExpiry;
}
