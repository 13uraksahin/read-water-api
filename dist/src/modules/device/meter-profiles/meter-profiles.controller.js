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
exports.MeterProfilesController = void 0;
const common_1 = require("@nestjs/common");
const meter_profiles_service_1 = require("./meter-profiles.service");
const meter_profile_dto_1 = require("./dto/meter-profile.dto");
const jwt_auth_guard_1 = require("../../iam/auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../iam/auth/guards/permissions.guard");
const decorators_1 = require("../../../common/decorators");
const constants_1 = require("../../../common/constants");
let MeterProfilesController = class MeterProfilesController {
    meterProfilesService;
    constructor(meterProfilesService) {
        this.meterProfilesService = meterProfilesService;
    }
    async create(dto) {
        return this.meterProfilesService.create(dto);
    }
    async findAll(query) {
        return this.meterProfilesService.findAll(query);
    }
    async getCommunicationTechFields() {
        return this.meterProfilesService.getCommunicationTechFields();
    }
    async findOne(id) {
        return this.meterProfilesService.findOne(id);
    }
    async update(id, dto) {
        return this.meterProfilesService.update(id, dto);
    }
    async patch(id, dto) {
        return this.meterProfilesService.update(id, dto);
    }
    async delete(id) {
        await this.meterProfilesService.delete(id);
    }
};
exports.MeterProfilesController = MeterProfilesController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_CREATE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meter_profile_dto_1.CreateMeterProfileDto]),
    __metadata("design:returntype", Promise)
], MeterProfilesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meter_profile_dto_1.MeterProfileQueryDto]),
    __metadata("design:returntype", Promise)
], MeterProfilesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('communication-tech-fields'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MeterProfilesController.prototype, "getCommunicationTechFields", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeterProfilesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meter_profile_dto_1.UpdateMeterProfileDto]),
    __metadata("design:returntype", Promise)
], MeterProfilesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meter_profile_dto_1.UpdateMeterProfileDto]),
    __metadata("design:returntype", Promise)
], MeterProfilesController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.PROFILE_DELETE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MeterProfilesController.prototype, "delete", null);
exports.MeterProfilesController = MeterProfilesController = __decorate([
    (0, common_1.Controller)('profiles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [meter_profiles_service_1.MeterProfilesService])
], MeterProfilesController);
//# sourceMappingURL=meter-profiles.controller.js.map