import { AlarmsService } from './alarms.service';
import type { PaginatedAlarms, AlarmData } from './alarms.service';
import type { AuthenticatedUser } from '../../common/interfaces';
export declare class AlarmsController {
    private readonly alarmsService;
    constructor(alarmsService: AlarmsService);
    getAlarms(page?: string, limit?: string, tenantId?: string, meterId?: string, status?: string, type?: string, severity?: string): Promise<PaginatedAlarms>;
    getAlarm(id: string): Promise<AlarmData>;
    acknowledgeAlarm(id: string, user: AuthenticatedUser): Promise<AlarmData>;
    resolveAlarm(id: string, resolution: string, user: AuthenticatedUser): Promise<AlarmData>;
}
