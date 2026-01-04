import { CommunicationTechnology, IntegrationType, DeviceBrand } from '@prisma/client';
export { DeviceBrand as ModuleBrand } from '@prisma/client';
export declare class FieldDefinitionDto {
    name: string;
    label?: string;
    type: string;
    length?: number;
    regex?: string;
    required?: boolean;
    description?: string;
}
export declare class ScenarioDto {
    id?: string;
    name: string;
    isDefault?: boolean;
    decoderFunction?: string;
    testPayload?: string;
    expectedBatteryMonths?: number;
    messageInterval?: number;
    description?: string;
}
export declare class CommunicationConfigDto {
    technology: CommunicationTechnology;
    fieldDefinitions: FieldDefinitionDto[];
    scenarios?: ScenarioDto[];
    decoderFunction?: string;
    testPayload?: string;
}
export declare class CreateModuleProfileDto {
    brand: DeviceBrand;
    modelCode: string;
    communicationTechnology?: CommunicationTechnology;
    integrationType?: IntegrationType;
    fieldDefinitions?: FieldDefinitionDto[];
    communicationConfigs?: CommunicationConfigDto[];
    decoderFunction?: string;
    testPayload?: string;
    expectedOutput?: any;
    batteryLifeMonths?: number;
    compatibleMeterProfileIds?: string[];
}
export declare class UpdateModuleProfileDto {
    modelCode?: string;
    communicationTechnology?: CommunicationTechnology;
    integrationType?: IntegrationType;
    fieldDefinitions?: FieldDefinitionDto[];
    communicationConfigs?: CommunicationConfigDto[];
    decoderFunction?: string;
    testPayload?: string;
    expectedOutput?: any;
    batteryLifeMonths?: number;
    compatibleMeterProfileIds?: string[];
}
export declare class ModuleProfileQueryDto {
    page?: number;
    limit?: number;
    brand?: DeviceBrand;
    technology?: CommunicationTechnology;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export { CreateModuleProfileDto as CreateDeviceProfileDto, UpdateModuleProfileDto as UpdateDeviceProfileDto, ModuleProfileQueryDto as DeviceProfileQueryDto, };
