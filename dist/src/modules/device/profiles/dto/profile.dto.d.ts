import { Brand, MeterType, DialType, ConnectionType, MountingType, TemperatureType, IPRating, CommunicationModule } from '@prisma/client';
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
    compatibleDeviceProfileIds?: string[];
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
    compatibleDeviceProfileIds?: string[];
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
