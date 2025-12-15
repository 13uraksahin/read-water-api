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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigfoxCallbackDto = exports.LoRaWANUplinkDto = exports.IngestBatchDto = exports.IngestReadingDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class IngestReadingDto {
    deviceId;
    payload;
    technology;
    timestamp;
    metadata;
}
exports.IngestReadingDto = IngestReadingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], IngestReadingDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], IngestReadingDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], IngestReadingDto.prototype, "technology", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IngestReadingDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], IngestReadingDto.prototype, "metadata", void 0);
class IngestBatchDto {
    tenantId;
    readings;
}
exports.IngestBatchDto = IngestBatchDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IngestBatchDto.prototype, "tenantId", void 0);
class LoRaWANUplinkDto {
    devEUI;
    data;
    fPort;
    fCnt;
    rxInfo;
    txInfo;
}
exports.LoRaWANUplinkDto = LoRaWANUplinkDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoRaWANUplinkDto.prototype, "devEUI", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoRaWANUplinkDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], LoRaWANUplinkDto.prototype, "fPort", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], LoRaWANUplinkDto.prototype, "fCnt", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], LoRaWANUplinkDto.prototype, "rxInfo", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], LoRaWANUplinkDto.prototype, "txInfo", void 0);
class SigfoxCallbackDto {
    device;
    data;
    time;
    seqNumber;
    avgSnr;
    station;
    rssi;
}
exports.SigfoxCallbackDto = SigfoxCallbackDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SigfoxCallbackDto.prototype, "device", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SigfoxCallbackDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SigfoxCallbackDto.prototype, "time", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SigfoxCallbackDto.prototype, "seqNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SigfoxCallbackDto.prototype, "avgSnr", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SigfoxCallbackDto.prototype, "station", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SigfoxCallbackDto.prototype, "rssi", void 0);
//# sourceMappingURL=ingestion.dto.js.map