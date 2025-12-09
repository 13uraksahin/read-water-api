import { DecodersService } from './decoders.service';
import type { PaginatedDecoders } from './decoders.service';
export declare class DecodersController {
    private readonly decodersService;
    constructor(decodersService: DecodersService);
    getDecoders(page?: string, limit?: string, technology?: string, isActive?: string): Promise<PaginatedDecoders>;
}
