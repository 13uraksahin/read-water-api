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
exports.ControlValveDto = exports.MeterQueryDto = exports.UpdateMeterDto = exports.CreateMeterDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class AddressDto {
    city;
    district;
    neighborhood;
    street;
    buildingNo;
    floor;
    doorNo;
    postalCode;
    extraDetails;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "district", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "neighborhood", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "street", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "buildingNo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "floor", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "doorNo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "postalCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddressDto.prototype, "extraDetails", void 0);
class ConnectivityFieldsDto {
    technology;
    fields;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectivityFieldsDto.prototype, "technology", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], ConnectivityFieldsDto.prototype, "fields", void 0);
class ConnectivityConfigDto {
    primary;
    secondary;
    others;
}
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ConnectivityFieldsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ConnectivityFieldsDto)
], ConnectivityConfigDto.prototype, "primary", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ConnectivityFieldsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ConnectivityFieldsDto)
], ConnectivityConfigDto.prototype, "secondary", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ConnectivityFieldsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ConnectivityConfigDto.prototype, "others", void 0);
class CreateMeterDto {
    tenantId;
    customerId;
    meterProfileId;
    serialNumber;
    initialIndex;
    installationDate;
    status;
    connectivityConfig;
    address;
    addressCode;
    latitude;
    longitude;
    metadata;
}
exports.CreateMeterDto = CreateMeterDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMeterDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterDto.prototype, "meterProfileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterDto.prototype, "serialNumber", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterDto.prototype, "initialIndex", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeterDto.prototype, "installationDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeterStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMeterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ConnectivityConfigDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ConnectivityConfigDto)
], CreateMeterDto.prototype, "connectivityConfig", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", AddressDto)
], CreateMeterDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMeterDto.prototype, "addressCode", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMeterDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMeterDto.prototype, "metadata", void 0);
class UpdateMeterDto {
    customerId;
    meterProfileId;
    serialNumber;
    status;
    valveStatus;
    connectivityConfig;
    address;
    addressCode;
    latitude;
    longitude;
    metadata;
}
exports.UpdateMeterDto = UpdateMeterDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterDto.prototype, "meterProfileId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterDto.prototype, "serialNumber", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeterStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ValveStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterDto.prototype, "valveStatus", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ConnectivityConfigDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", ConnectivityConfigDto)
], UpdateMeterDto.prototype, "connectivityConfig", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AddressDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", AddressDto)
], UpdateMeterDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateMeterDto.prototype, "addressCode", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMeterDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateMeterDto.prototype, "metadata", void 0);
class MeterQueryDto {
    page;
    limit;
    tenantId;
    customerId;
    status;
    brand;
    search;
    sortBy;
    sortOrder;
}
exports.MeterQueryDto = MeterQueryDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MeterQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MeterQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterQueryDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeterStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterQueryDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MeterQueryDto.prototype, "sortOrder", void 0);
class ControlValveDto {
    action;
}
exports.ControlValveDto = ControlValveDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ValveStatus),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ControlValveDto.prototype, "action", void 0);
//# sourceMappingURL=meter.dto.js.map