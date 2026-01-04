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
exports.MetersController = void 0;
const common_1 = require("@nestjs/common");
const meters_service_1 = require("./meters.service");
const meter_dto_1 = require("./dto/meter.dto");
const jwt_auth_guard_1 = require("../../iam/auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../iam/auth/guards/permissions.guard");
const decorators_1 = require("../../../common/decorators");
const constants_1 = require("../../../common/constants");
let MetersController = class MetersController {
    metersService;
    constructor(metersService) {
        this.metersService = metersService;
    }
    async create(dto, user) {
        return this.metersService.create(dto, user);
    }
    async findAll(query, user) {
        return this.metersService.findAll(query, user);
    }
    async findOne(id, user) {
        return this.metersService.findOne(id, user);
    }
    async getReadingHistory(id, days, user) {
        return this.metersService.getReadingHistory(id, user, days || 30);
    }
    async update(id, dto, user) {
        return this.metersService.update(id, dto, user);
    }
    async patch(id, dto, user) {
        return this.metersService.update(id, dto, user);
    }
    async linkSubscription(id, dto, user) {
        return this.metersService.linkSubscription(id, dto, user);
    }
    async unlinkSubscription(id, user) {
        return this.metersService.unlinkSubscription(id, user);
    }
    async linkModule(id, dto, user) {
        return this.metersService.linkDevice(id, dto, user);
    }
    async unlinkModule(id, dto, user) {
        return this.metersService.unlinkDevice(id, dto, user);
    }
    async controlValve(id, dto, user) {
        return this.metersService.controlValve(id, dto, user);
    }
    async delete(id, user) {
        await this.metersService.delete(id, user);
    }
};
exports.MetersController = MetersController;
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_CREATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meter_dto_1.CreateMeterDto, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_READ),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meter_dto_1.MeterQueryDto, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/readings'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.READING_READ),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "getReadingHistory", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meter_dto_1.UpdateMeterDto, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meter_dto_1.UpdateMeterDto, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)(':id/link-subscription'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meter_dto_1.LinkSubscriptionDto, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "linkSubscription", null);
__decorate([
    (0, common_1.Post)(':id/unlink-subscription'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "unlinkSubscription", null);
__decorate([
    (0, common_1.Post)(':id/link-module'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meter_dto_1.LinkDeviceDto, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "linkModule", null);
__decorate([
    (0, common_1.Post)(':id/unlink-module'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_UPDATE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meter_dto_1.UnlinkDeviceDto, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "unlinkModule", null);
__decorate([
    (0, common_1.Post)(':id/valve'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.VALVE_CONTROL),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, meter_dto_1.ControlValveDto, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "controlValve", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, decorators_1.RequirePermissions)(constants_1.PERMISSIONS.METER_DELETE),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MetersController.prototype, "delete", null);
exports.MetersController = MetersController = __decorate([
    (0, common_1.Controller)('meters'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [meters_service_1.MetersService])
], MetersController);
//# sourceMappingURL=meters.controller.js.map