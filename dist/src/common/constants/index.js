"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.PERMISSIONS = exports.SYSTEM_ROLES = exports.PAGINATION = exports.CACHE_TTL = exports.CACHE_KEYS = exports.SOCKET_EVENTS = exports.QUEUES = void 0;
exports.QUEUES = {
    READINGS: 'readings-queue',
    ALARMS: 'alarms-queue',
    NOTIFICATIONS: 'notifications-queue',
};
exports.SOCKET_EVENTS = {
    READING_NEW: 'reading:new',
    READING_BATCH: 'reading:batch',
    ALARM_NEW: 'alarm:new',
    ALARM_UPDATED: 'alarm:updated',
    ALARM_RESOLVED: 'alarm:resolved',
    METER_STATUS_CHANGED: 'meter:status-changed',
    METER_VALVE_CHANGED: 'meter:valve-changed',
    DASHBOARD_UPDATE: 'dashboard:update',
    CLIENT_CONNECTED: 'client:connected',
    CLIENT_DISCONNECTED: 'client:disconnected',
    JOIN_TENANT_ROOM: 'join:tenant',
    LEAVE_TENANT_ROOM: 'leave:tenant',
};
exports.CACHE_KEYS = {
    USER_SESSION: (userId) => `session:${userId}`,
    TENANT_SETTINGS: (tenantId) => `tenant:${tenantId}:settings`,
    METER_PROFILE: (profileId) => `profile:${profileId}`,
    DECODER_FUNCTION: (decoderId) => `decoder:${decoderId}`,
    RATE_LIMIT: (key) => `ratelimit:${key}`,
};
exports.CACHE_TTL = {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
    DAY: 86400,
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 30,
    MAX_LIMIT: 100,
};
exports.SYSTEM_ROLES = {
    PLATFORM_ADMIN: 'PLATFORM_ADMIN',
    TENANT_ADMIN: 'TENANT_ADMIN',
    OPERATOR: 'OPERATOR',
    VIEWER: 'VIEWER',
    FIELD_ENGINEER: 'FIELD_ENGINEER',
    CUSTOMER: 'CUSTOMER',
};
exports.PERMISSIONS = {
    TENANT_CREATE: 'tenant.create',
    TENANT_READ: 'tenant.read',
    TENANT_UPDATE: 'tenant.update',
    TENANT_DELETE: 'tenant.delete',
    USER_CREATE: 'user.create',
    USER_READ: 'user.read',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    METER_CREATE: 'meter.create',
    METER_READ: 'meter.read',
    METER_UPDATE: 'meter.update',
    METER_DELETE: 'meter.delete',
    READING_READ: 'reading.read',
    READING_EXPORT: 'reading.export',
    VALVE_CONTROL: 'valve.control',
    CUSTOMER_CREATE: 'customer.create',
    CUSTOMER_READ: 'customer.read',
    CUSTOMER_UPDATE: 'customer.update',
    CUSTOMER_DELETE: 'customer.delete',
    PROFILE_CREATE: 'profile.create',
    PROFILE_READ: 'profile.read',
    PROFILE_UPDATE: 'profile.update',
    PROFILE_DELETE: 'profile.delete',
    SETTINGS_READ: 'settings.read',
    SETTINGS_UPDATE: 'settings.update',
};
exports.ROLE_PERMISSIONS = {
    [exports.SYSTEM_ROLES.PLATFORM_ADMIN]: Object.values(exports.PERMISSIONS),
    [exports.SYSTEM_ROLES.TENANT_ADMIN]: [
        exports.PERMISSIONS.TENANT_READ,
        exports.PERMISSIONS.TENANT_UPDATE,
        exports.PERMISSIONS.USER_CREATE,
        exports.PERMISSIONS.USER_READ,
        exports.PERMISSIONS.USER_UPDATE,
        exports.PERMISSIONS.USER_DELETE,
        exports.PERMISSIONS.METER_CREATE,
        exports.PERMISSIONS.METER_READ,
        exports.PERMISSIONS.METER_UPDATE,
        exports.PERMISSIONS.METER_DELETE,
        exports.PERMISSIONS.READING_READ,
        exports.PERMISSIONS.READING_EXPORT,
        exports.PERMISSIONS.VALVE_CONTROL,
        exports.PERMISSIONS.CUSTOMER_CREATE,
        exports.PERMISSIONS.CUSTOMER_READ,
        exports.PERMISSIONS.CUSTOMER_UPDATE,
        exports.PERMISSIONS.CUSTOMER_DELETE,
        exports.PERMISSIONS.PROFILE_READ,
        exports.PERMISSIONS.SETTINGS_READ,
        exports.PERMISSIONS.SETTINGS_UPDATE,
    ],
    [exports.SYSTEM_ROLES.OPERATOR]: [
        exports.PERMISSIONS.METER_CREATE,
        exports.PERMISSIONS.METER_READ,
        exports.PERMISSIONS.METER_UPDATE,
        exports.PERMISSIONS.READING_READ,
        exports.PERMISSIONS.CUSTOMER_CREATE,
        exports.PERMISSIONS.CUSTOMER_READ,
        exports.PERMISSIONS.CUSTOMER_UPDATE,
    ],
    [exports.SYSTEM_ROLES.VIEWER]: [
        exports.PERMISSIONS.TENANT_READ,
        exports.PERMISSIONS.USER_READ,
        exports.PERMISSIONS.METER_READ,
        exports.PERMISSIONS.READING_READ,
        exports.PERMISSIONS.CUSTOMER_READ,
        exports.PERMISSIONS.PROFILE_READ,
    ],
    [exports.SYSTEM_ROLES.FIELD_ENGINEER]: [
        exports.PERMISSIONS.METER_READ,
        exports.PERMISSIONS.METER_UPDATE,
        exports.PERMISSIONS.READING_READ,
    ],
    [exports.SYSTEM_ROLES.CUSTOMER]: [
        exports.PERMISSIONS.READING_READ,
        exports.PERMISSIONS.METER_READ,
    ],
};
//# sourceMappingURL=index.js.map