import { PrismaService } from '../../core/prisma/prisma.service';
export interface DashboardStats {
    totalMeters: number;
    totalCustomers: number;
    totalReadings: number;
    totalWaterUsage: number;
    activeAlarms: number;
    metersInMaintenance: number;
    metersOffline: number;
}
export declare class DashboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getStats(tenantId?: string): Promise<DashboardStats>;
    private getOfflineMetersCount;
}
