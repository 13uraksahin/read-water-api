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
exports.ProfileQueryDto = exports.UpdateMeterProfileDto = exports.CreateMeterProfileDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CommunicationConfigDto {
    technology;
    fields;
    decoder;
}
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationTechnology),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CommunicationConfigDto.prototype, "technology", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CommunicationConfigDto.prototype, "fields", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CommunicationConfigDto.prototype, "decoder", void 0);
class CreateMeterProfileDto {
    brand;
    modelCode;
    meterType;
    dialType;
    connectionType;
    mountingType;
    temperatureType;
    diameter;
    length;
    width;
    height;
    q1;
    q2;
    q3;
    q4;
    rValue;
    pressureLoss;
    ipRating;
    communicationModule;
    batteryLifeMonths;
    communicationConfigs;
    specifications;
}
exports.CreateMeterProfileDto = CreateMeterProfileDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Brand),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "modelCode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeterType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "meterType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DialType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "dialType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ConnectionType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "connectionType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MountingType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "mountingType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TemperatureType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "temperatureType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "diameter", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "length", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "q1", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "q2", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "q3", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "q4", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "rValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "pressureLoss", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.IPRating),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "ipRating", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationModule),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "communicationModule", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "batteryLifeMonths", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CommunicationConfigDto),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateMeterProfileDto.prototype, "communicationConfigs", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMeterProfileDto.prototype, "specifications", void 0);
class UpdateMeterProfileDto {
    modelCode;
    meterType;
    dialType;
    connectionType;
    mountingType;
    temperatureType;
    diameter;
    length;
    width;
    height;
    q1;
    q2;
    q3;
    q4;
    rValue;
    pressureLoss;
    ipRating;
    communicationModule;
    batteryLifeMonths;
    communicationConfigs;
    specifications;
}
exports.UpdateMeterProfileDto = UpdateMeterProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterProfileDto.prototype, "modelCode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeterType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterProfileDto.prototype, "meterType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DialType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterProfileDto.prototype, "dialType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ConnectionType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterProfileDto.prototype, "connectionType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MountingType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterProfileDto.prototype, "mountingType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TemperatureType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterProfileDto.prototype, "temperatureType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "diameter", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "length", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "q1", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "q2", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "q3", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "q4", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "rValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "pressureLoss", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.IPRating),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterProfileDto.prototype, "ipRating", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationModule),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterProfileDto.prototype, "communicationModule", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "batteryLifeMonths", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CommunicationConfigDto),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateMeterProfileDto.prototype, "communicationConfigs", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateMeterProfileDto.prototype, "specifications", void 0);
class ProfileQueryDto {
    page;
    limit;
    brand;
    meterType;
    search;
    sortBy;
    sortOrder;
}
exports.ProfileQueryDto = ProfileQueryDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ProfileQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ProfileQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Brand),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProfileQueryDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeterType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProfileQueryDto.prototype, "meterType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProfileQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProfileQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProfileQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=profile.dto.js.map