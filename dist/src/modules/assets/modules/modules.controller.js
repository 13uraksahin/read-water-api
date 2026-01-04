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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesController = exports.ModulesController = void 0;
const common_1 = require("@nestjs/common");
const modules_service_1 = require("./modules.service");
const module_dto_1 = require("./dto/module.dto");
const jwt_auth_guard_1 = require("../../iam/auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../iam/auth/guards/permissions.guard");
const decorators_1 = require("../../../common/decorators");
const constants_1 = require("../../../common/constants");
let ModulesController = class ModulesController {
    modulesService;
    constructor(modulesService) {
        this.modulesService = modulesService;
    }
    async create(dto, user) {
        return this.modulesService.create(dto, user);
    }
    async bulkCreate(dto, user) {
        return this.modulesService.bulkCreate(dto, user);
    }
    async findAll(query, user) {
        return this.modulesService.findAll(query, user);
    }
    async findAvailable(tenantId, meterProfileId, user) {
        return this.modulesService.findAvailable(tenantId, meterProfileId, user);
    }
    async findOne(id, user) {
        return this.modulesService.findOne(id, user);
    }
    async update(id, dto, user) {
        return this.modulesService.update(id, dto, user);
    }
    async patch(id, dto, user) {
        return this.modulesService.update(id, dto, user);
    }
    async delete(id, user) {
        await this.modulesService.delete(id, user);
    }
};
exports.ModulesController = ModulesController;
exports.DevicesController = ModulesController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.MODULE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [module_dto_1.CreateModuleDto, Object]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.MODULE_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [module_dto_1.BulkCreateModuleDto, Object]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "bulkCreate", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.MODULE_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [module_dto_1.ModuleQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.MODULE_READ),
    __param(0, (0, common_1.Query)('tenantId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('meterProfileId', common_1.ParseUUIDPipe)),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "findAvailable", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.MODULE_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.MODULE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, module_dto_1.UpdateModuleDto, Object]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.MODULE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, module_dto_1.UpdateModuleDto, Object]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.MODULE_DELETE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "delete", null);
exports.DevicesController = exports.ModulesController = ModulesController = __decorate([
    (0, common_1.Controller)('modules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [modules_service_1.ModulesService])
], ModulesController);
//# sourceMappingURL=modules.controller.js.map