import { PrismaService } from '../../core/prisma/prisma.service';
export interface DecoderData {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string | null;
    technology: string;
    functionCode: string;
    testPayload: string | null;
    expectedOutput: Record<string, unknown> | null;
    lastTestedAt: Date | null;
    lastTestSucceeded: boolean | null;
    deviceProfileId: string;
    deviceProfile: {
        id: string;
        brand: string;
        modelCode: string;
    };
}
export interface PaginatedDecoders {
    data: DecoderData[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface DecodersQueryParams {
    page?: number;
    limit?: number;
    technology?: string;
    brand?: string;
}
export declare class DecodersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getDecoders(params: DecodersQueryParams): Promise<PaginatedDecoders>;
    getDecoder(deviceProfileId: string): Promise<DecoderData | null>;
}
