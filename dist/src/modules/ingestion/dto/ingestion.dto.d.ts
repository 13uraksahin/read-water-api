import { ValidationOptions } from 'class-validator';
import { CommunicationTechnology } from '@prisma/client';
import type { IntegrationMetadata } from '../../../common/interfaces';
export declare function IsValidTime(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
export declare function TransformToISOString(): PropertyDecorator;
export declare class IngestReadingDto {
    device: string;
    payload: string;
    technology: CommunicationTechnology;
    time?: string | number;
    metadata?: IntegrationMetadata;
}
export declare class IngestBatchDto {
    tenantId?: string;
    readings: IngestReadingDto[];
}
export declare class LoRaWANUplinkDto {
    devEUI: string;
    data: string;
    fPort?: number;
    fCnt?: number;
    rxInfo?: Array<{
        gatewayID: string;
        rssi: number;
        snr: number;
    }>;
    txInfo?: {
        frequency: number;
        dr: number;
    };
}
export declare class SigfoxCallbackDto {
    device: string;
    data: string;
    time?: number;
    seqNumber?: number;
    avgSnr?: number;
    station?: string;
    rssi?: number;
}
