"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.now = exports.TimeFormat = void 0;
exports.detectTimeFormat = detectTimeFormat;
exports.toDate = toDate;
exports.toISOString = toISOString;
exports.convertTime = convertTime;
exports.isValidTimeRange = isValidTimeRange;
var TimeFormat;
(function (TimeFormat) {
    TimeFormat["ISO_8601"] = "ISO_8601";
    TimeFormat["EPOCH_SECONDS"] = "EPOCH_SECONDS";
    TimeFormat["EPOCH_MS"] = "EPOCH_MS";
    TimeFormat["DATE_OBJECT"] = "DATE_OBJECT";
})(TimeFormat || (exports.TimeFormat = TimeFormat = {}));
const EPOCH_SECONDS_MIN = 1_000_000_000;
const EPOCH_SECONDS_MAX = 10_000_000_000;
const EPOCH_MS_MIN = 1_000_000_000_000;
function detectTimeFormat(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (value instanceof Date) {
        return TimeFormat.DATE_OBJECT;
    }
    if (typeof value === 'number') {
        if (value >= EPOCH_MS_MIN) {
            return TimeFormat.EPOCH_MS;
        }
        if (value >= EPOCH_SECONDS_MIN && value < EPOCH_SECONDS_MAX) {
            return TimeFormat.EPOCH_SECONDS;
        }
        if (value > 0 && value < EPOCH_SECONDS_MIN) {
            return TimeFormat.EPOCH_SECONDS;
        }
        return null;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d+$/.test(trimmed)) {
            const numValue = parseInt(trimmed, 10);
            return detectTimeFormat(numValue);
        }
        if (/^\d+\.\d+$/.test(trimmed)) {
            const numValue = parseFloat(trimmed);
            if (numValue >= EPOCH_MS_MIN) {
                return TimeFormat.EPOCH_MS;
            }
            return TimeFormat.EPOCH_SECONDS;
        }
        const parsed = Date.parse(trimmed);
        if (!isNaN(parsed)) {
            return TimeFormat.ISO_8601;
        }
        return null;
    }
    return null;
}
function toDate(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const format = detectTimeFormat(value);
    if (format === null) {
        return null;
    }
    switch (format) {
        case TimeFormat.DATE_OBJECT:
            return value;
        case TimeFormat.EPOCH_SECONDS:
            if (typeof value === 'string') {
                return new Date(parseFloat(value) * 1000);
            }
            return new Date(value * 1000);
        case TimeFormat.EPOCH_MS:
            if (typeof value === 'string') {
                return new Date(parseFloat(value));
            }
            return new Date(value);
        case TimeFormat.ISO_8601:
            return new Date(value);
        default:
            return null;
    }
}
function toISOString(value) {
    const date = toDate(value);
    if (date === null || isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
}
function convertTime(value) {
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
function isValidTimeRange(value, maxAgeMs = 365 * 24 * 60 * 60 * 1000, maxFutureMs = 60 * 60 * 1000) {
    const date = toDate(value);
    if (date === null || isNaN(date.getTime())) {
        return false;
    }
    const now = Date.now();
    const timestamp = date.getTime();
    if (now - timestamp > maxAgeMs) {
        return false;
    }
    if (timestamp - now > maxFutureMs) {
        return false;
    }
    return true;
}
exports.now = {
    date: () => new Date(),
    iso: () => new Date().toISOString(),
    epochSeconds: () => Math.floor(Date.now() / 1000),
    epochMs: () => Date.now(),
};
//# sourceMappingURL=time.util.js.map