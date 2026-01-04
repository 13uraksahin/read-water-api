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
exports.BulkCreateDeviceDto = exports.DeviceQueryDto = exports.UpdateDeviceDto = exports.CreateDeviceDto = exports.BulkCreateModuleDto = exports.ModuleQueryDto = exports.UpdateModuleDto = exports.CreateModuleDto = exports.ModuleStatus = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
var client_2 = require("@prisma/client");
Object.defineProperty(exports, "ModuleStatus", { enumerable: true, get: function () { return client_2.DeviceStatus; } });
class CreateModuleDto {
    tenantId;
    moduleProfileId;
    serialNumber;
    status;
    selectedTechnology;
    activeScenarioIds;
    dynamicFields;
    metadata;
}
exports.CreateModuleDto = CreateModuleDto;
exports.CreateDeviceDto = CreateModuleDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateModuleDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateModuleDto.prototype, "moduleProfileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateModuleDto.prototype, "serialNumber", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DeviceStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModuleDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModuleDto.prototype, "selectedTechnology", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateModuleDto.prototype, "activeScenarioIds", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], CreateModuleDto.prototype, "dynamicFields", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateModuleDto.prototype, "metadata", void 0);
class UpdateModuleDto {
    status;
    selectedTechnology;
    activeScenarioIds;
    dynamicFields;
    lastSignalStrength;
    lastBatteryLevel;
    metadata;
}
exports.UpdateModuleDto = UpdateModuleDto;
exports.UpdateDeviceDto = UpdateModuleDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DeviceStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateModuleDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateModuleDto.prototype, "selectedTechnology", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateModuleDto.prototype, "activeScenarioIds", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateModuleDto.prototype, "dynamicFields", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateModuleDto.prototype, "lastSignalStrength", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateModuleDto.prototype, "lastBatteryLevel", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateModuleDto.prototype, "metadata", void 0);
class ModuleQueryDto {
    page;
    limit;
    tenantId;
    moduleProfileId;
    status;
    brand;
    technology;
    search;
    sortBy;
    sortOrder;
}
exports.ModuleQueryDto = ModuleQueryDto;
exports.DeviceQueryDto = ModuleQueryDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], ModuleQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], ModuleQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModuleQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModuleQueryDto.prototype, "moduleProfileId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DeviceStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModuleQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModuleQueryDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModuleQueryDto.prototype, "technology", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModuleQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModuleQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ModuleQueryDto.prototype, "sortOrder", void 0);
class BulkCreateModuleDto {
    tenantId;
    moduleProfileId;
    modules;
}
exports.BulkCreateModuleDto = BulkCreateModuleDto;
exports.BulkCreateDeviceDto = BulkCreateModuleDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkCreateModuleDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BulkCreateModuleDto.prototype, "moduleProfileId", void 0);
//# sourceMappingURL=module.dto.js.map