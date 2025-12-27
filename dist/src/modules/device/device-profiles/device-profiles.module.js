"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceProfilesModule = void 0;
const common_1 = require("@nestjs/common");
const device_profiles_controller_1 = require("./device-profiles.controller");
const device_profiles_service_1 = require("./device-profiles.service");
let DeviceProfilesModule = class DeviceProfilesModule {
};
exports.DeviceProfilesModule = DeviceProfilesModule;
exports.DeviceProfilesModule = DeviceProfilesModule = __decorate([
    (0, common_1.Module)({
        controllers: [device_profiles_controller_1.DeviceProfilesController, device_profiles_controller_1.DecodersController],
        providers: [device_profiles_service_1.DeviceProfilesService],
        exports: [device_profiles_service_1.DeviceProfilesService],
    })
], DeviceProfilesModule);
//# sourceMappingURL=device-profiles.module.js.map