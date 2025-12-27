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
export declare class SettingsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getSettings(): Promise<PlatformSettings>;
    updateSettings(dto: UpdateSettingsDto): Promise<PlatformSettings>;
    private getStringValue;
}
