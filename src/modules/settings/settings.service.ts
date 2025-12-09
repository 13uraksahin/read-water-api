// =============================================================================
// Settings Service
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface PlatformSettings {
  domain: string | null;
  httpCallbackUrl: string | null;
  mqttUrl: string | null;
  logoUrl: string | null;
  platformName: string | null;
  platformTitle: string | null;
  platformDescription: string | null;
}

export interface UpdateSettingsDto {
  domain?: string;
  httpCallbackUrl?: string;
  mqttUrl?: string;
  logoUrl?: string;
  platformName?: string;
  platformTitle?: string;
  platformDescription?: string;
}

// Setting keys
const SETTING_KEYS = {
  DOMAIN: 'platform.domain',
  HTTP_CALLBACK_URL: 'platform.httpCallbackUrl',
  MQTT_URL: 'platform.mqttUrl',
  LOGO_URL: 'platform.logoUrl',
  PLATFORM_NAME: 'platform.name',
  PLATFORM_TITLE: 'platform.title',
  PLATFORM_DESCRIPTION: 'platform.description',
} as const;

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all platform settings
   */
  async getSettings(): Promise<PlatformSettings> {
    const settings = await this.prisma.setting.findMany({
      where: {
        tenantId: null, // Global settings
        category: 'platform',
      },
    });

    const settingsMap = new Map<string, unknown>();
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

  /**
   * Update platform settings
   */
  async updateSettings(dto: UpdateSettingsDto): Promise<PlatformSettings> {
    const updates: Array<{ key: string; value: string }> = [];

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

    // Upsert all settings
    await Promise.all(
      updates.map((update) =>
        this.prisma.setting.upsert({
          where: {
            tenantId_key: {
              tenantId: null as any, // Global setting
              key: update.key,
            },
          },
          create: {
            key: update.key,
            value: update.value as any,
            category: 'platform',
          },
          update: {
            value: update.value as any,
          },
        }),
      ),
    );

    return this.getSettings();
  }

  private getStringValue(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      // Handle JSON value wrapper
      const obj = value as Record<string, unknown>;
      if ('value' in obj) return String(obj.value);
    }
    return String(value);
  }
}
