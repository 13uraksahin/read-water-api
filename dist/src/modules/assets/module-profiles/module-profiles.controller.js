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
exports.DeviceProfilesController = exports.DecodersController = exports.ModuleProfilesController = void 0;
const common_1 = require("@nestjs/common");
const module_profiles_service_1 = require("./module-profiles.service");
const module_profile_dto_1 = require("./dto/module-profile.dto");
const jwt_auth_guard_1 = require("../../iam/auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../iam/auth/guards/permissions.guard");
const decorators_1 = require("../../../common/decorators");
const constants_1 = require("../../../common/constants");
let ModuleProfilesController = class ModuleProfilesController {
    moduleProfilesService;
    constructor(moduleProfilesService) {
        this.moduleProfilesService = moduleProfilesService;
    }
    async create(dto) {
        return this.moduleProfilesService.create(dto);
    }
    async findAll(query) {
        return this.moduleProfilesService.findAll(query);
    }
    async findOne(id) {
        return this.moduleProfilesService.findOne(id);
    }
    async update(id, dto) {
        return this.moduleProfilesService.update(id, dto);
    }
    async patch(id, dto) {
        return this.moduleProfilesService.update(id, dto);
    }
    async delete(id) {
        await this.moduleProfilesService.delete(id);
    }
    async testDecoder(id, payload) {
        return this.moduleProfilesService.testDecoder(id, payload);
    }
};
exports.ModuleProfilesController = ModuleProfilesController;
exports.DeviceProfilesController = ModuleProfilesController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_CREATE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [module_profile_dto_1.CreateModuleProfileDto]),
    __metadata("design:returntype", Promise)
], ModuleProfilesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [module_profile_dto_1.ModuleProfileQueryDto]),
    __metadata("design:returntype", Promise)
], ModuleProfilesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModuleProfilesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, module_profile_dto_1.UpdateModuleProfileDto]),
    __metadata("design:returntype", Promise)
], ModuleProfilesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, module_profile_dto_1.UpdateModuleProfileDto]),
    __metadata("design:returntype", Promise)
], ModuleProfilesController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_DELETE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModuleProfilesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/test-decoder'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('payload')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ModuleProfilesController.prototype, "testDecoder", null);
exports.DeviceProfilesController = exports.ModuleProfilesController = ModuleProfilesController = __decorate([
    (0, common_1.Controller)('module-profiles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [module_profiles_service_1.ModuleProfilesService])
], ModuleProfilesController);
let DecodersController = class DecodersController {
    moduleProfilesService;
    constructor(moduleProfilesService) {
        this.moduleProfilesService = moduleProfilesService;
    }
    async getDecoders(page, limit, technology, brand) {
        return this.moduleProfilesService.getDecoders({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            technology,
            brand,
        });
    }
    async getDecoder(id) {
        return this.moduleProfilesService.getDecoder(id);
    }
};
exports.DecodersController = DecodersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('technology')),
    __param(3, (0, common_1.Query)('brand')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], DecodersController.prototype, "getDecoders", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DecodersController.prototype, "getDecoder", null);
exports.DecodersController = DecodersController = __decorate([
    (0, common_1.Controller)('decoders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [module_profiles_service_1.ModuleProfilesService])
], DecodersController);
//# sourceMappingURL=module-profiles.controller.js.map