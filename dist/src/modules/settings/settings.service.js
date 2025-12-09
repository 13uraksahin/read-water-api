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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const SETTING_KEYS = {
    DOMAIN: 'platform.domain',
    HTTP_CALLBACK_URL: 'platform.httpCallbackUrl',
    MQTT_URL: 'platform.mqttUrl',
    LOGO_URL: 'platform.logoUrl',
    PLATFORM_NAME: 'platform.name',
    PLATFORM_TITLE: 'platform.title',
    PLATFORM_DESCRIPTION: 'platform.description',
};
let SettingsService = SettingsService_1 = class SettingsService {
    prisma;
    logger = new common_1.Logger(SettingsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings() {
        const settings = await this.prisma.setting.findMany({
            where: {
                tenantId: null,
                category: 'platform',
            },
        });
        const settingsMap = new Map();
        settings.forEach((s) => {
            settingsMap.set(s.key, s.value);
        });
        return {
            domain: this.getStringValue(settingsMap.get(SETTING_KEYS.DOMAIN)),
            httpCallbackUrl: this.getStringValue(settingsMap.get(SETTING_KEYS.HTTP_CALLBACK_URL)),
            mqttUrl: this.getStringValue(settingsMap.get(SETTING_KEYS.MQTT_URL)),
            logoUrl: this.getStringValue(settingsMap.get(SETTING_KEYS.LOGO_URL)),
            platformName: this.getStringValue(settingsMap.get(SETTING_KEYS.PLATFORM_NAME)),
            platformTitle: this.getStringValue(settingsMap.get(SETTING_KEYS.PLATFORM_TITLE)),
            platformDescription: this.getStringValue(settingsMap.get(SETTING_KEYS.PLATFORM_DESCRIPTION)),
        };
    }
    async updateSettings(dto) {
        const updates = [];
        if (dto.domain !== undefined) {
            updates.push({ key: SETTING_KEYS.DOMAIN, value: dto.domain });
        }
        if (dto.httpCallbackUrl !== undefined) {
            updates.push({ key: SETTING_KEYS.HTTP_CALLBACK_URL, value: dto.httpCallbackUrl });
        }
        if (dto.mqttUrl !== undefined) {
            updates.push({ key: SETTING_KEYS.MQTT_URL, value: dto.mqttUrl });
        }
        if (dto.logoUrl !== undefined) {
            updates.push({ key: SETTING_KEYS.LOGO_URL, value: dto.logoUrl });
        }
        if (dto.platformName !== undefined) {
            updates.push({ key: SETTING_KEYS.PLATFORM_NAME, value: dto.platformName });
        }
        if (dto.platformTitle !== undefined) {
            updates.push({ key: SETTING_KEYS.PLATFORM_TITLE, value: dto.platformTitle });
        }
        if (dto.platformDescription !== undefined) {
            updates.push({ key: SETTING_KEYS.PLATFORM_DESCRIPTION, value: dto.platformDescription });
        }
        await Promise.all(updates.map((update) => this.prisma.setting.upsert({
            where: {
                tenantId_key: {
                    tenantId: null,
                    key: update.key,
                },
            },
            create: {
                key: update.key,
                value: update.value,
                category: 'platform',
            },
            update: {
                value: update.value,
            },
        })));
        return this.getSettings();
    }
    getStringValue(value) {
        if (value === null || value === undefined)
            return null;
        if (typeof value === 'string')
            return value;
        if (typeof value === 'object' && value !== null) {
            const obj = value;
            if ('value' in obj)
                return String(obj.value);
        }
        return String(value);
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map