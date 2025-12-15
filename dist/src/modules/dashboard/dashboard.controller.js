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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const jwt_auth_guard_1 = require("../iam/auth/guards/jwt-auth.guard");
const decorators_1 = require("../../common/decorators");
let DashboardController = class DashboardController {
    dashboardService;
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getStats(user, tenantId) {
        return this.dashboardService.getStats(user, tenantId);
    }
    async getMapData(user, tenantId) {
        return this.dashboardService.getMapData(user, tenantId);
    }
    async getAlarms(user, tenantId, limit) {
        return this.dashboardService.getAlarms(user, tenantId, limit);
    }
    async getConsumptionChart(user, tenantId, days) {
        return this.dashboardService.getConsumptionChart(user, tenantId, days);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('map'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMapData", null);
__decorate([
    (0, common_1.Get)('alarms'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('tenantId')),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getAlarms", null);
__decorate([
    (0, common_1.Get)('consumption'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('tenantId')),
    __param(2, (0, common_1.Query)('days', new common_1.DefaultValuePipe(30), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getConsumptionChart", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map