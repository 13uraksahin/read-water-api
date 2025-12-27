import { SettingsService } from './settings.service';
import type { PlatformSettings, UpdateSettingsDto } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<PlatformSettings>;
    updateSettings(dto: UpdateSettingsDto): Promise<PlatformSettings>;
}
