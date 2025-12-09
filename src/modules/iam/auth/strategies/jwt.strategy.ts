// =============================================================================
// JWT Strategy
// =============================================================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { JwtPayload, AuthenticatedUser } from '../../../../common/interfaces';
import { ROLE_PERMISSIONS } from '../../../../common/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const { sub: userId, tenantId } = payload;

    // Fetch user with tenant info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenants: {
          where: tenantId ? { tenantId } : undefined,
          include: {
            tenant: true,
          },
          take: 1,
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const userTenant = user.tenants[0];
    if (!userTenant) {
      throw new UnauthorizedException('User has no tenant assignment');
    }

    // Get role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[userTenant.role] || [];
    // Merge with custom permissions
    const permissions = [...new Set([...rolePermissions, ...userTenant.permissions])];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: userTenant.tenantId,
      tenantPath: userTenant.tenant.path,
      role: userTenant.role,
      permissions,
    };
  }
}

