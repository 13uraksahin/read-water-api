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
exports.AlarmsController = void 0;
const common_1 = require("@nestjs/common");
const alarms_service_1 = require("./alarms.service");
const jwt_auth_guard_1 = require("../iam/auth/guards/jwt-auth.guard");
const decorators_1 = require("../../common/decorators");
let AlarmsController = class AlarmsController {
    alarmsService;
    constructor(alarmsService) {
        this.alarmsService = alarmsService;
    }
    async getAlarms(page, limit, tenantId, meterId, status, type, severity) {
        return this.alarmsService.getAlarms({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            tenantId,
            meterId,
            status,
            type,
            severity: severity ? parseInt(severity, 10) : undefined,
        });
    }
    async getAlarm(id) {
        return this.alarmsService.getAlarm(id);
    }
    async acknowledgeAlarm(id, user) {
        return this.alarmsService.acknowledgeAlarm(id, user.id);
    }
    async resolveAlarm(id, resolution, user) {
        return this.alarmsService.resolveAlarm(id, user.id, resolution);
    }
};
exports.AlarmsController = AlarmsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('tenantId')),
    __param(3, (0, common_1.Query)('meterId')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('type')),
    __param(6, (0, common_1.Query)('severity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AlarmsController.prototype, "getAlarms", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AlarmsController.prototype, "getAlarm", null);
__decorate([
    (0, common_1.Post)(':id/acknowledge'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AlarmsController.prototype, "acknowledgeAlarm", null);
__decorate([
    (0, common_1.Post)(':id/resolve'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('resolution')),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AlarmsController.prototype, "resolveAlarm", null);
exports.AlarmsController = AlarmsController = __decorate([
    (0, common_1.Controller)('alarms'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [alarms_service_1.AlarmsService])
], AlarmsController);
//# sourceMappingURL=alarms.controller.js.map