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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterProfileQueryDto = exports.UpdateMeterProfileDto = exports.CreateMeterProfileDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
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
    compatibleDeviceProfileIds;
    specifications;
}
exports.CreateMeterProfileDto = CreateMeterProfileDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Brand),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_a = typeof client_1.Brand !== "undefined" && client_1.Brand) === "function" ? _a : Object)
], CreateMeterProfileDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterProfileDto.prototype, "modelCode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeterType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_b = typeof client_1.MeterType !== "undefined" && client_1.MeterType) === "function" ? _b : Object)
], CreateMeterProfileDto.prototype, "meterType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DialType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_c = typeof client_1.DialType !== "undefined" && client_1.DialType) === "function" ? _c : Object)
], CreateMeterProfileDto.prototype, "dialType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ConnectionType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_d = typeof client_1.ConnectionType !== "undefined" && client_1.ConnectionType) === "function" ? _d : Object)
], CreateMeterProfileDto.prototype, "connectionType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MountingType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_e = typeof client_1.MountingType !== "undefined" && client_1.MountingType) === "function" ? _e : Object)
], CreateMeterProfileDto.prototype, "mountingType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TemperatureType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_f = typeof client_1.TemperatureType !== "undefined" && client_1.TemperatureType) === "function" ? _f : Object)
], CreateMeterProfileDto.prototype, "temperatureType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "diameter", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "length", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "q1", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "q2", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "q3", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "q4", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "rValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CreateMeterProfileDto.prototype, "pressureLoss", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.IPRating),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_g = typeof client_1.IPRating !== "undefined" && client_1.IPRating) === "function" ? _g : Object)
], CreateMeterProfileDto.prototype, "ipRating", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationModule),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_h = typeof client_1.CommunicationModule !== "undefined" && client_1.CommunicationModule) === "function" ? _h : Object)
], CreateMeterProfileDto.prototype, "communicationModule", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateMeterProfileDto.prototype, "compatibleDeviceProfileIds", void 0);
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
    compatibleDeviceProfileIds;
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
    __metadata("design:type", typeof (_j = typeof client_1.MeterType !== "undefined" && client_1.MeterType) === "function" ? _j : Object)
], UpdateMeterProfileDto.prototype, "meterType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.DialType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_k = typeof client_1.DialType !== "undefined" && client_1.DialType) === "function" ? _k : Object)
], UpdateMeterProfileDto.prototype, "dialType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ConnectionType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_l = typeof client_1.ConnectionType !== "undefined" && client_1.ConnectionType) === "function" ? _l : Object)
], UpdateMeterProfileDto.prototype, "connectionType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MountingType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_m = typeof client_1.MountingType !== "undefined" && client_1.MountingType) === "function" ? _m : Object)
], UpdateMeterProfileDto.prototype, "mountingType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TemperatureType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_o = typeof client_1.TemperatureType !== "undefined" && client_1.TemperatureType) === "function" ? _o : Object)
], UpdateMeterProfileDto.prototype, "temperatureType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "diameter", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "length", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "q1", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "q2", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "q3", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "q4", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "rValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], UpdateMeterProfileDto.prototype, "pressureLoss", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.IPRating),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_p = typeof client_1.IPRating !== "undefined" && client_1.IPRating) === "function" ? _p : Object)
], UpdateMeterProfileDto.prototype, "ipRating", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CommunicationModule),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_q = typeof client_1.CommunicationModule !== "undefined" && client_1.CommunicationModule) === "function" ? _q : Object)
], UpdateMeterProfileDto.prototype, "communicationModule", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateMeterProfileDto.prototype, "compatibleDeviceProfileIds", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateMeterProfileDto.prototype, "specifications", void 0);
class MeterProfileQueryDto {
    page;
    limit;
    brand;
    meterType;
    search;
    sortBy;
    sortOrder;
}
exports.MeterProfileQueryDto = MeterProfileQueryDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], MeterProfileQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], MeterProfileQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Brand),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_r = typeof client_1.Brand !== "undefined" && client_1.Brand) === "function" ? _r : Object)
], MeterProfileQueryDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeterType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_s = typeof client_1.MeterType !== "undefined" && client_1.MeterType) === "function" ? _s : Object)
], MeterProfileQueryDto.prototype, "meterType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterProfileQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterProfileQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterProfileQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=meter-profile.dto.js.map