import { DashboardService, DashboardStats, MeterMapData, DashboardAlarm, ConsumptionDataPoint } from './dashboard.service';
import type { AuthenticatedUser } from '../../common/interfaces';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(user: AuthenticatedUser, tenantId?: string): Promise<DashboardStats>;
    getMapData(user: AuthenticatedUser, tenantId?: string): Promise<MeterMapData[]>;
    getAlarms(user: AuthenticatedUser, tenantId?: string, limit?: number): Promise<DashboardAlarm[]>;
    getConsumptionChart(user: AuthenticatedUser, tenantId?: string, days?: number): Promise<ConsumptionDataPoint[]>;
}
