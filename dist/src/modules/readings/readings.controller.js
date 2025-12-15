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
exports.ReadingsController = void 0;
const common_1 = require("@nestjs/common");
const readings_service_1 = require("./readings.service");
const jwt_auth_guard_1 = require("../iam/auth/guards/jwt-auth.guard");
const decorators_1 = require("../../common/decorators");
let ReadingsController = class ReadingsController {
    readingsService;
    constructor(readingsService) {
        this.readingsService = readingsService;
    }
    async getReadings(user, page, limit, meterId, tenantId, sourceDeviceId) {
        return this.readingsService.getReadings({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            meterId,
            tenantId,
            sourceDeviceId,
        }, user);
    }
};
exports.ReadingsController = ReadingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('meterId')),
    __param(4, (0, common_1.Query)('tenantId')),
    __param(5, (0, common_1.Query)('sourceDeviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReadingsController.prototype, "getReadings", null);
exports.ReadingsController = ReadingsController = __decorate([
    (0, common_1.Controller)('readings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [readings_service_1.ReadingsService])
], ReadingsController);
//# sourceMappingURL=readings.controller.js.map