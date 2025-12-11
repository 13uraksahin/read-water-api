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
exports.DecodersController = void 0;
const common_1 = require("@nestjs/common");
const decoders_service_1 = require("./decoders.service");
const jwt_auth_guard_1 = require("../iam/auth/guards/jwt-auth.guard");
let DecodersController = class DecodersController {
    decodersService;
    constructor(decodersService) {
        this.decodersService = decodersService;
    }
    async getDecoders(page, limit, technology, brand) {
        return this.decodersService.getDecoders({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            technology,
            brand,
        });
    }
    async getDecoder(id) {
        return this.decodersService.getDecoder(id);
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
    __metadata("design:paramtypes", [decoders_service_1.DecodersService])
], DecodersController);
//# sourceMappingURL=decoders.controller.js.map