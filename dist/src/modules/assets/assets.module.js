"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsModule = void 0;
const common_1 = require("@nestjs/common");
const meters_module_1 = require("./meters/meters.module");
const meter_profiles_module_1 = require("./meter-profiles/meter-profiles.module");
const modules_module_1 = require("./modules/modules.module");
const module_profiles_module_1 = require("./module-profiles/module-profiles.module");
let AssetsModule = class AssetsModule {
};
exports.AssetsModule = AssetsModule;
exports.AssetsModule = AssetsModule = __decorate([
    (0, common_1.Module)({
        imports: [meters_module_1.MetersModule, meter_profiles_module_1.MeterProfilesModule, modules_module_1.ModulesModule, module_profiles_module_1.ModuleProfilesModule],
        exports: [meters_module_1.MetersModule, meter_profiles_module_1.MeterProfilesModule, modules_module_1.ModulesModule, module_profiles_module_1.ModuleProfilesModule],
    })
], AssetsModule);
//# sourceMappingURL=assets.module.js.map