"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeterProfilesModule = void 0;
const common_1 = require("@nestjs/common");
const meter_profiles_service_1 = require("./meter-profiles.service");
const meter_profiles_controller_1 = require("./meter-profiles.controller");
let MeterProfilesModule = class MeterProfilesModule {
};
exports.MeterProfilesModule = MeterProfilesModule;
exports.MeterProfilesModule = MeterProfilesModule = __decorate([
    (0, common_1.Module)({
        controllers: [meter_profiles_controller_1.MeterProfilesController],
        providers: [meter_profiles_service_1.MeterProfilesService],
        exports: [meter_profiles_service_1.MeterProfilesService],
    })
], MeterProfilesModule);
//# sourceMappingURL=meter-profiles.module.js.map