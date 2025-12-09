import { Brand, MeterType, DialType, ConnectionType, MountingType, TemperatureType, IPRating, CommunicationModule, CommunicationTechnology } from '@prisma/client';
declare class CommunicationConfigDto {
    technology: CommunicationTechnology;
    fields?: Array<{
        name: string;
        label: string;
        type: string;
        length?: number;
        regex?: string;
        required: boolean;
        description?: string;
    }>;
    decoder?: string;
}
export declare class CreateMeterProfileDto {
    brand: Brand;
    modelCode: string;
    meterType: MeterType;
    dialType: DialType;
    connectionType: ConnectionType;
    mountingType: MountingType;
    temperatureType: TemperatureType;
    diameter?: number;
    length?: number;
    width?: number;
    height?: number;
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
    rValue?: number;
    pressureLoss?: number;
    ipRating?: IPRating;
    communicationModule?: CommunicationModule;
    batteryLifeMonths?: number;
    communicationConfigs?: CommunicationConfigDto[];
    specifications?: Record<string, any>;
}
export declare class UpdateMeterProfileDto {
    modelCode?: string;
    meterType?: MeterType;
    dialType?: DialType;
    connectionType?: ConnectionType;
    mountingType?: MountingType;
    temperatureType?: TemperatureType;
    diameter?: number;
    length?: number;
    width?: number;
    height?: number;
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
    rValue?: number;
    pressureLoss?: number;
    ipRating?: IPRating;
    communicationModule?: CommunicationModule;
    batteryLifeMonths?: number;
    communicationConfigs?: CommunicationConfigDto[];
    specifications?: Record<string, any>;
}
export declare class ProfileQueryDto {
    page?: number;
    limit?: number;
    brand?: Brand;
    meterType?: MeterType;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export {};
