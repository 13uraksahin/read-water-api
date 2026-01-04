export declare enum TimeFormat {
    ISO_8601 = "ISO_8601",
    EPOCH_SECONDS = "EPOCH_SECONDS",
    EPOCH_MS = "EPOCH_MS",
    DATE_OBJECT = "DATE_OBJECT"
}
export interface TimeConversionResult {
    date: Date;
    iso: string;
    detectedFormat: TimeFormat;
    originalValue: string | number | Date;
}
export declare function detectTimeFormat(value: string | number | Date | undefined | null): TimeFormat | null;
export declare function toDate(value: string | number | Date | undefined | null): Date | null;
export declare function toISOString(value: string | number | Date | undefined | null): string | null;
export declare function convertTime(value: string | number | Date | undefined | null): TimeConversionResult | null;
export declare function isValidTimeRange(value: string | number | Date | undefined | null, maxAgeMs?: number, maxFutureMs?: number): boolean;
export declare const now: {
    date: () => Date;
    iso: () => string;
    epochSeconds: () => number;
    epochMs: () => number;
};
