import { ModuleProfilesService, DecoderData } from './module-profiles.service';
import { CreateModuleProfileDto, UpdateModuleProfileDto, ModuleProfileQueryDto } from './dto/module-profile.dto';
export declare class ModuleProfilesController {
    private readonly moduleProfilesService;
    constructor(moduleProfilesService: ModuleProfilesService);
    create(dto: CreateModuleProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brand: import("@prisma/client").$Enums.DeviceBrand;
        modelCode: string;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        communicationTechnology: import("@prisma/client").$Enums.CommunicationTechnology;
        integrationType: import("@prisma/client").$Enums.IntegrationType;
        fieldDefinitions: import("@prisma/client/runtime/library").JsonValue;
        decoderFunction: string | null;
        batteryLifeMonths: number | null;
        testPayload: string | null;
        expectedOutput: import("@prisma/client/runtime/library").JsonValue | null;
        lastTestedAt: Date | null;
        lastTestSucceeded: boolean | null;
    }>;
    findAll(query: ModuleProfileQueryDto): Promise<import("../../../common/interfaces").PaginatedResult<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brand: import("@prisma/client").$Enums.DeviceBrand;
        modelCode: string;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        communicationTechnology: import("@prisma/client").$Enums.CommunicationTechnology;
        integrationType: import("@prisma/client").$Enums.IntegrationType;
        fieldDefinitions: import("@prisma/client/runtime/library").JsonValue;
        decoderFunction: string | null;
        batteryLifeMonths: number | null;
        testPayload: string | null;
        expectedOutput: import("@prisma/client/runtime/library").JsonValue | null;
        lastTestedAt: Date | null;
        lastTestSucceeded: boolean | null;
    }>>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brand: import("@prisma/client").$Enums.DeviceBrand;
        modelCode: string;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        communicationTechnology: import("@prisma/client").$Enums.CommunicationTechnology;
        integrationType: import("@prisma/client").$Enums.IntegrationType;
        fieldDefinitions: import("@prisma/client/runtime/library").JsonValue;
        decoderFunction: string | null;
        batteryLifeMonths: number | null;
        testPayload: string | null;
        expectedOutput: import("@prisma/client/runtime/library").JsonValue | null;
        lastTestedAt: Date | null;
        lastTestSucceeded: boolean | null;
    }>;
    update(id: string, dto: UpdateModuleProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brand: import("@prisma/client").$Enums.DeviceBrand;
        modelCode: string;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        communicationTechnology: import("@prisma/client").$Enums.CommunicationTechnology;
        integrationType: import("@prisma/client").$Enums.IntegrationType;
        fieldDefinitions: import("@prisma/client/runtime/library").JsonValue;
        decoderFunction: string | null;
        batteryLifeMonths: number | null;
        testPayload: string | null;
        expectedOutput: import("@prisma/client/runtime/library").JsonValue | null;
        lastTestedAt: Date | null;
        lastTestSucceeded: boolean | null;
    }>;
    patch(id: string, dto: UpdateModuleProfileDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brand: import("@prisma/client").$Enums.DeviceBrand;
        modelCode: string;
        specifications: import("@prisma/client/runtime/library").JsonValue | null;
        communicationTechnology: import("@prisma/client").$Enums.CommunicationTechnology;
        integrationType: import("@prisma/client").$Enums.IntegrationType;
        fieldDefinitions: import("@prisma/client/runtime/library").JsonValue;
        decoderFunction: string | null;
        batteryLifeMonths: number | null;
        testPayload: string | null;
        expectedOutput: import("@prisma/client/runtime/library").JsonValue | null;
        lastTestedAt: Date | null;
        lastTestSucceeded: boolean | null;
    }>;
    delete(id: string): Promise<void>;
    testDecoder(id: string, payload?: string): Promise<{
        success: boolean;
        output?: any;
        error?: string;
    }>;
}
export declare class DecodersController {
    private readonly moduleProfilesService;
    constructor(moduleProfilesService: ModuleProfilesService);
    getDecoders(page?: string, limit?: string, technology?: string, brand?: string): Promise<{
        data: DecoderData[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getDecoder(id: string): Promise<DecoderData | null>;
}
export { ModuleProfilesController as DeviceProfilesController };
