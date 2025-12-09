import { DashboardService, DashboardStats } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(tenantId?: string): Promise<DashboardStats>;
}
