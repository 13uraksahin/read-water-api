"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceModule = void 0;
const common_1 = require("@nestjs/common");
const meters_module_1 = require("./meters/meters.module");
const meter_profiles_module_1 = require("./meter-profiles/meter-profiles.module");
const devices_module_1 = require("./devices/devices.module");
const device_profiles_module_1 = require("./device-profiles/device-profiles.module");
let DeviceModule = class DeviceModule {
};
exports.DeviceModule = DeviceModule;
exports.DeviceModule = DeviceModule = __decorate([
    (0, common_1.Module)({
        imports: [meters_module_1.MetersModule, meter_profiles_module_1.MeterProfilesModule, devices_module_1.DevicesModule, device_profiles_module_1.DeviceProfilesModule],
        exports: [meters_module_1.MetersModule, meter_profiles_module_1.MeterProfilesModule, devices_module_1.DevicesModule, device_profiles_module_1.DeviceProfilesModule],
    })
], DeviceModule);
//# sourceMappingURL=device.module.js.map