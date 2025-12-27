// =============================================================================
// Permission Guard - Route-level permission protection
// =============================================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_PERMISSIONS, hasAnyPermission, hasAllPermissions } from '../constants';
import { AuthenticatedUser } from '../interfaces';

// Metadata keys
export const PERMISSIONS_KEY = 'permissions';
export const PERMISSION_MODE_KEY = 'permission_mode';

// Permission check modes
export type PermissionMode = 'any' | 'all';

/**
 * Decorator to require specific permissions on a route
 * @param permissions - Array of required permission strings
 * @param mode - 'any' (default) requires at least one, 'all' requires all
 * 
 * @example
 * // Require any of these permissions
 * @RequirePermissions(['meter.read', 'meter.create'])
 * 
 * @example
 * // Require all permissions
 * @RequirePermissions(['meter.read', 'meter.update'], 'all')
 */
export const RequirePermissions = (
  permissions: string[],
  mode: PermissionMode = 'any',
): MethodDecorator & ClassDecorator => {
  const permissionDecorator = SetMetadata(PERMISSIONS_KEY, permissions);
  const modeDecorator = SetMetadata(PERMISSION_MODE_KEY, mode);
  
  return (
    target: object | Function,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    permissionDecorator(target, propertyKey as string, descriptor as PropertyDescriptor);
    modeDecorator(target, propertyKey as string, descriptor as PropertyDescriptor);
  };
};

/**
 * Guard that checks if user has required permissions
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get permission mode (any or all)
    const mode = this.reflector.getAllAndOverride<PermissionMode>(
      PERMISSION_MODE_KEY,
      [context.getHandler(), context.getClass()],
    ) || 'any';

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's effective permissions (from role + custom permissions)
    const userPermissions = this.getUserPermissions(user);

    // Check permissions based on mode
    const hasAccess =
      mode === 'all'
        ? hasAllPermissions(userPermissions, requiredPermissions)
        : hasAnyPermission(userPermissions, requiredPermissions);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Get all permissions for a user (role-based + custom)
   */
  private getUserPermissions(user: AuthenticatedUser): string[] {
    // Get role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Combine with any custom permissions
    const customPermissions = user.permissions || [];
    
    // Return unique permissions
    return [...new Set([...rolePermissions, ...customPermissions])];
  }
}

/**
 * Helper decorator for common permission patterns
 */

// Read-only access to a module
export const CanRead = (module: string) => RequirePermissions([`${module}.read`]);

// Create access to a module
export const CanCreate = (module: string) => RequirePermissions([`${module}.create`]);

// Update access to a module
export const CanUpdate = (module: string) => RequirePermissions([`${module}.update`]);

// Delete access to a module
export const CanDelete = (module: string) => RequirePermissions([`${module}.delete`]);

// Full CRUD access to a module
export const CanManage = (module: string) =>
  RequirePermissions([
    `${module}.create`,
    `${module}.read`,
    `${module}.update`,
    `${module}.delete`,
  ], 'any');
