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
exports.BulkCreateDeviceDto = exports.DeviceQueryDto = exports.UpdateDeviceDto = exports.CreateDeviceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateDeviceDto {
    tenantId;
    deviceProfileId;
    serialNumber;
    status;
    selectedTechnology;
    activeScenarioIds;
    dynamicFields;
    metadata;
}
exports.CreateDeviceDto = CreateDeviceDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "deviceProfileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "serialNumber", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DeviceStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceDto.prototype, "selectedTechnology", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateDeviceDto.prototype, "activeScenarioIds", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], CreateDeviceDto.prototype, "dynamicFields", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateDeviceDto.prototype, "metadata", void 0);
class UpdateDeviceDto {
    status;
    selectedTechnology;
    activeScenarioIds;
    dynamicFields;
    lastSignalStrength;
    lastBatteryLevel;
    metadata;
}
exports.UpdateDeviceDto = UpdateDeviceDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DeviceStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeviceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeviceDto.prototype, "selectedTechnology", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateDeviceDto.prototype, "activeScenarioIds", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateDeviceDto.prototype, "dynamicFields", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateDeviceDto.prototype, "lastSignalStrength", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateDeviceDto.prototype, "lastBatteryLevel", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateDeviceDto.prototype, "metadata", void 0);
class DeviceQueryDto {
    page;
    limit;
    tenantId;
    deviceProfileId;
    status;
    brand;
    technology;
    search;
    sortBy;
    sortOrder;
}
exports.DeviceQueryDto = DeviceQueryDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], DeviceQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], DeviceQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeviceQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeviceQueryDto.prototype, "deviceProfileId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DeviceStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeviceQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeviceQueryDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeviceQueryDto.prototype, "technology", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeviceQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeviceQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeviceQueryDto.prototype, "sortOrder", void 0);
class BulkCreateDeviceDto {
    tenantId;
    deviceProfileId;
    devices;
}
exports.BulkCreateDeviceDto = BulkCreateDeviceDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkCreateDeviceDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkCreateDeviceDto.prototype, "deviceProfileId", void 0);
//# sourceMappingURL=device.dto.js.map