import { PrismaService } from '../../core/prisma/prisma.service';
export interface ReadingWithMeter {
    id: string;
    time: Date;
    meterId: string;
    value: number;
    consumption: number;
    unit: string;
    signalStrength: number | null;
    batteryLevel: number | null;
    temperature: number | null;
    rawPayload: Record<string, unknown> | null;
    source: string | null;
    sourceDeviceId: string | null;
    communicationTechnology: string | null;
    processedAt: Date | null;
    decoderUsed: string | null;
    meter?: {
        id: string;
        serialNumber: string;
        tenantId: string;
        customer?: {
            id: string;
            details: Record<string, unknown>;
        } | null;
    };
}
export interface PaginatedReadings {
    data: ReadingWithMeter[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ReadingsQueryParams {
    page?: number;
    limit?: number;
    meterId?: string;
    tenantId?: string;
}
export declare class ReadingsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getReadings(params: ReadingsQueryParams): Promise<PaginatedReadings>;
    getMeterReadings(meterId: string, params: {
        page?: number;
        limit?: number;
    }): Promise<PaginatedReadings>;
}
