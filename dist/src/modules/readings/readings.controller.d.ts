import { ReadingsService, PaginatedReadings } from './readings.service';
export declare class ReadingsController {
    private readonly readingsService;
    constructor(readingsService: ReadingsService);
    getReadings(page?: string, limit?: string, meterId?: string, tenantId?: string): Promise<PaginatedReadings>;
}
