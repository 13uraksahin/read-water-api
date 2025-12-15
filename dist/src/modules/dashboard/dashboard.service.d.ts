import { PrismaService } from '../../core/prisma/prisma.service';
import { AlarmType, AlarmStatus, MeterStatus } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces';
export interface DashboardStats {
    totalMeters: number;
    totalCustomers: number;
    totalReadings: number;
    totalWaterUsage: number;
    activeAlarms: number;
    metersInMaintenance: number;
    metersOffline: number;
    totalDevices: number;
    devicesInWarehouse: number;
    devicesDeployed: number;
}
export type MeterMapStatus = 'alarm' | 'high_usage' | 'normal' | 'offline';
export interface MeterMapData {
    id: string;
    latitude: number;
    longitude: number;
    status: MeterStatus;
    mapStatus: MeterMapStatus;
    hasAlarm: boolean;
    isHighUsage: boolean;
    isOffline: boolean;
    serialNumber: string;
    customerName: string | null;
    batteryLevel: number | null;
    signalStrength: number | null;
    lastCommunicationAt: string | null;
}
export interface DashboardAlarm {
    id: string;
    type: AlarmType;
    status: AlarmStatus;
    severity: number;
    message: string | null;
    createdAt: Date;
    meterSerial: string;
    customerName: string | null;
}
export interface ConsumptionDataPoint {
    date: string;
    timestamp: number;
    consumption: number;
}
export declare class DashboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private buildTenantFilterByPath;
    private getEffectiveTenantPath;
    getStats(user: AuthenticatedUser, tenantId?: string): Promise<DashboardStats>;
    getMapData(user: AuthenticatedUser, tenantId?: string): Promise<MeterMapData[]>;
    getAlarms(user: AuthenticatedUser, tenantId?: string, limit?: number): Promise<DashboardAlarm[]>;
    getConsumptionChart(user: AuthenticatedUser, tenantId?: string, days?: number): Promise<ConsumptionDataPoint[]>;
    private isOffline;
    private getOfflineMetersCount;
    private getHighUsageMeters;
    private extractCustomerName;
    private getConsumptionChartFallback;
}
