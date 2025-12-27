"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanManage = exports.CanDelete = exports.CanUpdate = exports.CanCreate = exports.CanRead = exports.PermissionsGuard = exports.RequirePermissions = exports.PERMISSION_MODE_KEY = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const constants_1 = require("../constants");
exports.PERMISSIONS_KEY = 'permissions';
exports.PERMISSION_MODE_KEY = 'permission_mode';
const RequirePermissions = (permissions, mode = 'any') => {
    const permissionDecorator = (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, permissions);
    const modeDecorator = (0, common_1.SetMetadata)(exports.PERMISSION_MODE_KEY, mode);
    return (target, propertyKey, descriptor) => {
        permissionDecorator(target, propertyKey, descriptor);
        modeDecorator(target, propertyKey, descriptor);
    };
};
exports.RequirePermissions = RequirePermissions;
let PermissionsGuard = class PermissionsGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(exports.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const mode = this.reflector.getAllAndOverride(exports.PERMISSION_MODE_KEY, [context.getHandler(), context.getClass()]) || 'any';
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const userPermissions = this.getUserPermissions(user);
        const hasAccess = mode === 'all'
            ? (0, constants_1.hasAllPermissions)(userPermissions, requiredPermissions)
            : (0, constants_1.hasAnyPermission)(userPermissions, requiredPermissions);
        if (!hasAccess) {
            throw new common_1.ForbiddenException(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
        }
        return true;
    }
    getUserPermissions(user) {
        const rolePermissions = constants_1.ROLE_PERMISSIONS[user.role] || [];
        const customPermissions = user.permissions || [];
        return [...new Set([...rolePermissions, ...customPermissions])];
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
const CanRead = (module) => (0, exports.RequirePermissions)([`${module}.read`]);
exports.CanRead = CanRead;
const CanCreate = (module) => (0, exports.RequirePermissions)([`${module}.create`]);
exports.CanCreate = CanCreate;
const CanUpdate = (module) => (0, exports.RequirePermissions)([`${module}.update`]);
exports.CanUpdate = CanUpdate;
const CanDelete = (module) => (0, exports.RequirePermissions)([`${module}.delete`]);
exports.CanDelete = CanDelete;
const CanManage = (module) => (0, exports.RequirePermissions)([
    `${module}.create`,
    `${module}.read`,
    `${module}.update`,
    `${module}.delete`,
], 'any');
exports.CanManage = CanManage;
//# sourceMappingURL=permissions.guard.js.map