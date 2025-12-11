import { DecodersService } from './decoders.service';
import type { PaginatedDecoders, DecoderData } from './decoders.service';
export declare class DecodersController {
    private readonly decodersService;
    constructor(decodersService: DecodersService);
    getDecoders(page?: string, limit?: string, technology?: string, brand?: string): Promise<PaginatedDecoders>;
    getDecoder(id: string): Promise<DecoderData | null>;
}
