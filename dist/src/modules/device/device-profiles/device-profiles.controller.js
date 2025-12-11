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
exports.DeviceProfilesController = void 0;
const common_1 = require("@nestjs/common");
const device_profiles_service_1 = require("./device-profiles.service");
const device_profile_dto_1 = require("./dto/device-profile.dto");
const jwt_auth_guard_1 = require("../../iam/auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../iam/auth/guards/permissions.guard");
const decorators_1 = require("../../../common/decorators");
const constants_1 = require("../../../common/constants");
let DeviceProfilesController = class DeviceProfilesController {
    deviceProfilesService;
    constructor(deviceProfilesService) {
        this.deviceProfilesService = deviceProfilesService;
    }
    async create(dto) {
        return this.deviceProfilesService.create(dto);
    }
    async findAll(query) {
        return this.deviceProfilesService.findAll(query);
    }
    async findOne(id) {
        return this.deviceProfilesService.findOne(id);
    }
    async update(id, dto) {
        return this.deviceProfilesService.update(id, dto);
    }
    async delete(id) {
        await this.deviceProfilesService.delete(id);
    }
    async testDecoder(id, payload) {
        return this.deviceProfilesService.testDecoder(id, payload);
    }
};
exports.DeviceProfilesController = DeviceProfilesController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_CREATE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_profile_dto_1.CreateDeviceProfileDto]),
    __metadata("design:returntype", Promise)
], DeviceProfilesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_profile_dto_1.DeviceProfileQueryDto]),
    __metadata("design:returntype", Promise)
], DeviceProfilesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceProfilesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, device_profile_dto_1.UpdateDeviceProfileDto]),
    __metadata("design:returntype", Promise)
], DeviceProfilesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_DELETE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceProfilesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/test-decoder'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('payload')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DeviceProfilesController.prototype, "testDecoder", null);
exports.DeviceProfilesController = DeviceProfilesController = __decorate([
    (0, common_1.Controller)('device-profiles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [device_profiles_service_1.DeviceProfilesService])
], DeviceProfilesController);
//# sourceMappingURL=device-profiles.controller.js.map