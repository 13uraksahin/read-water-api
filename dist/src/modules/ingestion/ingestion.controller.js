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
var IngestionController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionController = void 0;
const common_1 = require("@nestjs/common");
const ingestion_service_1 = require("./ingestion.service");
const ingestion_dto_1 = require("./dto/ingestion.dto");
const decorators_1 = require("../../common/decorators");
let IngestionController = IngestionController_1 = class IngestionController {
    ingestionService;
    logger = new common_1.Logger(IngestionController_1.name);
    constructor(ingestionService) {
        this.ingestionService = ingestionService;
    }
    async ingestReading(dto) {
        return this.ingestionService.ingestReading(dto);
    }
    async ingestBatch(dto) {
        return this.ingestionService.ingestBatch(dto);
    }
    async lorawanUplink(dto) {
        this.logger.debug(`LoRaWAN uplink from ${dto.devEUI}`);
        return this.ingestionService.handleLoRaWANUplink(dto);
    }
    async sigfoxCallback(dto) {
        this.logger.debug(`Sigfox callback from ${dto.device}`);
        return this.ingestionService.handleSigfoxCallback(dto);
    }
    async health() {
        return {
            status: 'healthy',
            service: 'ingestion',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.IngestionController = IngestionController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ingestion_dto_1.IngestReadingDto]),
    __metadata("design:returntype", Promise)
], IngestionController.prototype, "ingestReading", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('batch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ingestion_dto_1.IngestBatchDto]),
    __metadata("design:returntype", Promise)
], IngestionController.prototype, "ingestBatch", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('lorawan'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ingestion_dto_1.LoRaWANUplinkDto]),
    __metadata("design:returntype", Promise)
], IngestionController.prototype, "lorawanUplink", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('sigfox'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ingestion_dto_1.SigfoxCallbackDto]),
    __metadata("design:returntype", Promise)
], IngestionController.prototype, "sigfoxCallback", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('health'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IngestionController.prototype, "health", null);
exports.IngestionController = IngestionController = IngestionController_1 = __decorate([
    (0, common_1.Controller)('ingest'),
    __metadata("design:paramtypes", [ingestion_service_1.IngestionService])
], IngestionController);
//# sourceMappingURL=ingestion.controller.js.map