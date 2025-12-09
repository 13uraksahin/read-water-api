// =============================================================================
// Settings Controller
// =============================================================================

import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { PlatformSettings, UpdateSettingsDto } from './settings.service';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(): Promise<PlatformSettings> {
    return this.settingsService.getSettings();
  }

  @Put()
  async updateSettings(@Body() dto: UpdateSettingsDto): Promise<PlatformSettings> {
    return this.settingsService.updateSettings(dto);
  }
}
