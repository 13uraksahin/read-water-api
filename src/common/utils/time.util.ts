// =============================================================================
// Time Utilities - Multi-Format Time Conversion
// =============================================================================
// Supports various time formats from different IoT integrations:
// - ISO 8601 strings (2025-01-15T10:30:00Z)
// - Unix timestamp in seconds (epoch seconds)
// - Unix timestamp in milliseconds (epoch milliseconds)
// - Date objects
// =============================================================================

/**
 * Time format types supported by integrations
 */
export enum TimeFormat {
  ISO_8601 = 'ISO_8601',           // ISO 8601 string: "2025-01-15T10:30:00Z"
  EPOCH_SECONDS = 'EPOCH_SECONDS', // Unix timestamp in seconds: 1736936400
  EPOCH_MS = 'EPOCH_MS',           // Unix timestamp in milliseconds: 1736936400000
  DATE_OBJECT = 'DATE_OBJECT',     // JavaScript Date object
}

/**
 * Time conversion result
 */
export interface TimeConversionResult {
  date: Date;
  iso: string;
  detectedFormat: TimeFormat;
  originalValue: string | number | Date;
}

/**
 * Thresholds for distinguishing between seconds and milliseconds
 * - Epoch seconds: ~1.7 billion (year 2023-2024 range)
 * - Epoch milliseconds: ~1.7 trillion
 */
const EPOCH_SECONDS_MIN = 1_000_000_000;   // Sept 9, 2001
const EPOCH_SECONDS_MAX = 10_000_000_000;  // Nov 20, 2286
const EPOCH_MS_MIN = 1_000_000_000_000;    // Sept 9, 2001 in ms

/**
 * Detect the format of a time value
 * @param value - Time value to analyze
 * @returns Detected TimeFormat
 */
export function detectTimeFormat(value: string | number | Date | undefined | null): TimeFormat | null {
  if (value === undefined || value === null) {
    return null;
  }

  // Date object
  if (value instanceof Date) {
    return TimeFormat.DATE_OBJECT;
  }

  // Number - could be epoch seconds or milliseconds
  if (typeof value === 'number') {
    if (value >= EPOCH_MS_MIN) {
      return TimeFormat.EPOCH_MS;
    }
    if (value >= EPOCH_SECONDS_MIN && value < EPOCH_SECONDS_MAX) {
      return TimeFormat.EPOCH_SECONDS;
    }
    // Very old timestamps might be seconds
    if (value > 0 && value < EPOCH_SECONDS_MIN) {
      return TimeFormat.EPOCH_SECONDS;
    }
    return null;
  }

  // String - check various formats
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Check if it's a numeric string (epoch)
    if (/^\d+$/.test(trimmed)) {
      const numValue = parseInt(trimmed, 10);
      return detectTimeFormat(numValue);
    }

    // Check if it's a numeric string with decimal (epoch with fractional seconds)
    if (/^\d+\.\d+$/.test(trimmed)) {
      const numValue = parseFloat(trimmed);
      if (numValue >= EPOCH_MS_MIN) {
        return TimeFormat.EPOCH_MS;
      }
      return TimeFormat.EPOCH_SECONDS;
    }

    // Try to parse as ISO 8601 or other date string formats
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      return TimeFormat.ISO_8601;
    }

    return null;
  }

  return null;
}

/**
 * Convert any supported time format to a Date object
 * @param value - Time value to convert
 * @returns Date object or null if conversion fails
 */
export function toDate(value: string | number | Date | undefined | null): Date | null {
  if (value === undefined || value === null) {
    return null;
  }

  const format = detectTimeFormat(value);

  if (format === null) {
    return null;
  }

  switch (format) {
    case TimeFormat.DATE_OBJECT:
      return value as Date;

    case TimeFormat.EPOCH_SECONDS:
      if (typeof value === 'string') {
        return new Date(parseFloat(value) * 1000);
      }
      return new Date((value as number) * 1000);

    case TimeFormat.EPOCH_MS:
      if (typeof value === 'string') {
        return new Date(parseFloat(value));
      }
      return new Date(value as number);

    case TimeFormat.ISO_8601:
      return new Date(value as string);

    default:
      return null;
  }
}

/**
 * Convert any supported time format to ISO 8601 string
 * @param value - Time value to convert
 * @returns ISO 8601 string or null if conversion fails
 */
export function toISOString(value: string | number | Date | undefined | null): string | null {
  const date = toDate(value);
  if (date === null || isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

/**
 * Convert time value with full result including detected format
 * @param value - Time value to convert
 * @returns TimeConversionResult or null if conversion fails
 */
export function convertTime(value: string | number | Date | undefined | null): TimeConversionResult | null {
  if (value === undefined || value === null) {
    return null;
  }

  const format = detectTimeFormat(value);
  if (format === null) {
    return null;
  }

  const date = toDate(value);
  if (date === null || isNaN(date.getTime())) {
    return null;
  }

  return {
    date,
    iso: date.toISOString(),
    detectedFormat: format,
    originalValue: value,
  };
}

/**
 * Validate if a time value is within a reasonable range
 * @param value - Time value to validate
 * @param maxAgeMs - Maximum age in milliseconds (default: 1 year)
 * @param maxFutureMs - Maximum future time in milliseconds (default: 1 hour)
 * @returns true if time is valid and within range
 */
export function isValidTimeRange(
  value: string | number | Date | undefined | null,
  maxAgeMs: number = 365 * 24 * 60 * 60 * 1000, // 1 year
  maxFutureMs: number = 60 * 60 * 1000, // 1 hour
): boolean {
  const date = toDate(value);
  if (date === null || isNaN(date.getTime())) {
    return false;
  }

  const now = Date.now();
  const timestamp = date.getTime();

  // Check if too old
  if (now - timestamp > maxAgeMs) {
    return false;
  }

  // Check if too far in the future
  if (timestamp - now > maxFutureMs) {
    return false;
  }

  return true;
}

/**
 * Get current time in various formats
 */
export const now = {
  date: (): Date => new Date(),
  iso: (): string => new Date().toISOString(),
  epochSeconds: (): number => Math.floor(Date.now() / 1000),
  epochMs: (): number => Date.now(),
};
