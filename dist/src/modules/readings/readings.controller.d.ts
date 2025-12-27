import { ReadingsService, PaginatedReadings } from './readings.service';
import type { AuthenticatedUser } from '../../common/interfaces';
export declare class ReadingsController {
    private readonly readingsService;
    constructor(readingsService: ReadingsService);
    getReadings(user: AuthenticatedUser, page?: string, limit?: string, meterId?: string, tenantId?: string, sourceDeviceId?: string): Promise<PaginatedReadings>;
}
