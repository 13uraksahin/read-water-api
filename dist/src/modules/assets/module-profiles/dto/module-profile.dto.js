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
exports.DeviceProfileQueryDto = exports.UpdateDeviceProfileDto = exports.CreateDeviceProfileDto = exports.ModuleProfileQueryDto = exports.UpdateModuleProfileDto = exports.CreateModuleProfileDto = exports.CommunicationConfigDto = exports.ScenarioDto = exports.FieldDefinitionDto = exports.ModuleBrand = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
var client_2 = require("@prisma/client");
Object.defineProperty(exports, "ModuleBrand", { enumerable: true, get: function () { return client_2.DeviceBrand; } });
class FieldDefinitionDto {
    name;
    label;
    type;
    length;
    regex;
    required;
    description;
}
exports.FieldDefinitionDto = FieldDefinitionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FieldDefinitionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FieldDefinitionDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FieldDefinitionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], FieldDefinitionDto.prototype, "length", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FieldDefinitionDto.prototype, "regex", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FieldDefinitionDto.prototype, "required", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FieldDefinitionDto.prototype, "description", void 0);
class ScenarioDto {
    id;
    name;
    isDefault;
    decoderFunction;
    testPayload;
    expectedBatteryMonths;
    messageInterval;
    description;
}
exports.ScenarioDto = ScenarioDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScenarioDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ScenarioDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ScenarioDto.prototype, "isDefault", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScenarioDto.prototype, "decoderFunction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScenarioDto.prototype, "testPayload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(240),
    __metadata("design:type", Number)
], ScenarioDto.prototype, "expectedBatteryMonths", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ScenarioDto.prototype, "messageInterval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScenarioDto.prototype, "description", void 0);
class CommunicationConfigDto {
    technology;
    fieldDefinitions;
    scenarios;
    decoderFunction;
    testPayload;
}
exports.CommunicationConfigDto = CommunicationConfigDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CommunicationConfigDto.prototype, "technology", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FieldDefinitionDto),
    __metadata("design:type", Array)
], CommunicationConfigDto.prototype, "fieldDefinitions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScenarioDto),
    __metadata("design:type", Array)
], CommunicationConfigDto.prototype, "scenarios", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CommunicationConfigDto.prototype, "decoderFunction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CommunicationConfigDto.prototype, "testPayload", void 0);
class CreateModuleProfileDto {
    brand;
    modelCode;
    communicationTechnology;
    integrationType;
    fieldDefinitions;
    communicationConfigs;
    decoderFunction;
    testPayload;
    expectedOutput;
    batteryLifeMonths;
    compatibleMeterProfileIds;
}
exports.CreateModuleProfileDto = CreateModuleProfileDto;
exports.CreateDeviceProfileDto = CreateModuleProfileDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DeviceBrand),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateModuleProfileDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateModuleProfileDto.prototype, "modelCode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModuleProfileDto.prototype, "communicationTechnology", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.IntegrationType),
    __metadata("design:type", String)
], CreateModuleProfileDto.prototype, "integrationType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FieldDefinitionDto),
    __metadata("design:type", Array)
], CreateModuleProfileDto.prototype, "fieldDefinitions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CommunicationConfigDto),
    __metadata("design:type", Array)
], CreateModuleProfileDto.prototype, "communicationConfigs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateModuleProfileDto.prototype, "decoderFunction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateModuleProfileDto.prototype, "testPayload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateModuleProfileDto.prototype, "expectedOutput", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(240),
    __metadata("design:type", Number)
], CreateModuleProfileDto.prototype, "batteryLifeMonths", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateModuleProfileDto.prototype, "compatibleMeterProfileIds", void 0);
class UpdateModuleProfileDto {
    modelCode;
    communicationTechnology;
    integrationType;
    fieldDefinitions;
    communicationConfigs;
    decoderFunction;
    testPayload;
    expectedOutput;
    batteryLifeMonths;
    compatibleMeterProfileIds;
}
exports.UpdateModuleProfileDto = UpdateModuleProfileDto;
exports.UpdateDeviceProfileDto = UpdateModuleProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateModuleProfileDto.prototype, "modelCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    __metadata("design:type", String)
], UpdateModuleProfileDto.prototype, "communicationTechnology", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.IntegrationType),
    __metadata("design:type", String)
], UpdateModuleProfileDto.prototype, "integrationType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FieldDefinitionDto),
    __metadata("design:type", Array)
], UpdateModuleProfileDto.prototype, "fieldDefinitions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CommunicationConfigDto),
    __metadata("design:type", Array)
], UpdateModuleProfileDto.prototype, "communicationConfigs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateModuleProfileDto.prototype, "decoderFunction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateModuleProfileDto.prototype, "testPayload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateModuleProfileDto.prototype, "expectedOutput", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(240),
    __metadata("design:type", Number)
], UpdateModuleProfileDto.prototype, "batteryLifeMonths", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateModuleProfileDto.prototype, "compatibleMeterProfileIds", void 0);
class ModuleProfileQueryDto {
    page;
    limit;
    brand;
    technology;
    search;
    sortBy;
    sortOrder;
}
exports.ModuleProfileQueryDto = ModuleProfileQueryDto;
exports.DeviceProfileQueryDto = ModuleProfileQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ModuleProfileQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ModuleProfileQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.DeviceBrand),
    __metadata("design:type", String)
], ModuleProfileQueryDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    __metadata("design:type", String)
], ModuleProfileQueryDto.prototype, "technology", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModuleProfileQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModuleProfileQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['asc', 'desc']),
    __metadata("design:type", String)
], ModuleProfileQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=module-profile.dto.js.map