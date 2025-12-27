import { PrismaService } from '../../core/prisma/prisma.service';
export interface AlarmData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    meterId: string;
    type: string;
    status: string;
    severity: number;
    message: string | null;
    details: Record<string, unknown> | null;
    acknowledgedAt: Date | null;
    acknowledgedBy: string | null;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    resolution: string | null;
    meter?: {
        id: string;
        serialNumber: string;
        latitude: number | null;
        longitude: number | null;
        address: Record<string, unknown> | null;
    };
    tenant?: {
        id: string;
        name: string;
    };
}
export interface PaginatedAlarms {
    data: AlarmData[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface AlarmsQueryParams {
    page?: number;
    limit?: number;
    tenantId?: string;
    meterId?: string;
    status?: string;
    type?: string;
    severity?: number;
}
export declare class AlarmsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getAlarms(params: AlarmsQueryParams): Promise<PaginatedAlarms>;
    getAlarm(id: string): Promise<AlarmData>;
    acknowledgeAlarm(id: string, userId: string): Promise<AlarmData>;
    resolveAlarm(id: string, userId: string, resolution?: string): Promise<AlarmData>;
    private mapAlarm;
}
