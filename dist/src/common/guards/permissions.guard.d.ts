import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare const PERMISSIONS_KEY = "permissions";
export declare const PERMISSION_MODE_KEY = "permission_mode";
export type PermissionMode = 'any' | 'all';
export declare const RequirePermissions: (permissions: string[], mode?: PermissionMode) => MethodDecorator & ClassDecorator;
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private getUserPermissions;
}
export declare const CanRead: (module: string) => MethodDecorator & ClassDecorator;
export declare const CanCreate: (module: string) => MethodDecorator & ClassDecorator;
export declare const CanUpdate: (module: string) => MethodDecorator & ClassDecorator;
export declare const CanDelete: (module: string) => MethodDecorator & ClassDecorator;
export declare const CanManage: (module: string) => MethodDecorator & ClassDecorator;
