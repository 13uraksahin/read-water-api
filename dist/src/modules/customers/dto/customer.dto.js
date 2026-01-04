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
exports.ExportCustomersQueryDto = exports.BulkImportCustomersDto = exports.CustomerQueryDto = exports.UpdateCustomerDto = exports.CreateCustomerDto = exports.CustomerType = void 0;
const class_validator_1 = require("class-validator");
var CustomerType;
(function (CustomerType) {
    CustomerType["INDIVIDUAL"] = "INDIVIDUAL";
    CustomerType["ORGANIZATIONAL"] = "ORGANIZATIONAL";
})(CustomerType || (exports.CustomerType = CustomerType = {}));
class CreateCustomerDto {
    tenantId;
    customerNumber;
    customerType;
    details;
    metadata;
}
exports.CreateCustomerDto = CreateCustomerDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "customerNumber", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(CustomerType),
    __metadata("design:type", String)
], CreateCustomerDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateCustomerDto.prototype, "details", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateCustomerDto.prototype, "metadata", void 0);
class UpdateCustomerDto {
    customerNumber;
    customerType;
    details;
    metadata;
}
exports.UpdateCustomerDto = UpdateCustomerDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "customerNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CustomerType),
    __metadata("design:type", String)
], UpdateCustomerDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateCustomerDto.prototype, "details", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateCustomerDto.prototype, "metadata", void 0);
const class_transformer_1 = require("class-transformer");
const class_validator_2 = require("class-validator");
class CustomerQueryDto {
    page;
    limit;
    tenantId;
    customerType;
    search;
    sortBy;
    sortOrder;
}
exports.CustomerQueryDto = CustomerQueryDto;
__decorate([
    (0, class_validator_2.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CustomerQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_2.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CustomerQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomerQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(CustomerType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomerQueryDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomerQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomerQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CustomerQueryDto.prototype, "sortOrder", void 0);
class BulkImportCustomersDto {
    rows;
}
exports.BulkImportCustomersDto = BulkImportCustomersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], BulkImportCustomersDto.prototype, "rows", void 0);
class ExportCustomersQueryDto extends CustomerQueryDto {
}
exports.ExportCustomersQueryDto = ExportCustomersQueryDto;
__decorate([
    (0, class_validator_2.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value !== undefined ? Number(value) : 10000)),
    __metadata("design:type", Number)
], ExportCustomersQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=customer.dto.js.map