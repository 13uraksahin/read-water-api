import { CommunicationTechnology } from '@prisma/client';
export declare class IngestReadingDto {
    deviceId: string;
    payload: string;
    technology: CommunicationTechnology;
    timestamp?: string;
    metadata?: Record<string, any>;
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
