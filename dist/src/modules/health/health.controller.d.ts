import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    check(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
    }>;
    ready(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        services: {
            database: {
                status: string;
                latency?: number;
                error?: string;
            };
            redis: {
                status: string;
                latency?: number;
                error?: string;
            };
        };
    }>;
    live(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
