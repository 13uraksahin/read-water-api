export declare const QUEUES: {
    readonly READINGS: "readings-queue";
    readonly ALARMS: "alarms-queue";
    readonly NOTIFICATIONS: "notifications-queue";
};
export declare const SOCKET_EVENTS: {
    readonly READING_NEW: "reading:new";
    readonly READING_BATCH: "reading:batch";
    readonly ALARM_NEW: "alarm:new";
    readonly ALARM_UPDATED: "alarm:updated";
    readonly ALARM_RESOLVED: "alarm:resolved";
    readonly METER_STATUS_CHANGED: "meter:status-changed";
    readonly METER_VALVE_CHANGED: "meter:valve-changed";
    readonly DASHBOARD_UPDATE: "dashboard:update";
    readonly CLIENT_CONNECTED: "client:connected";
    readonly CLIENT_DISCONNECTED: "client:disconnected";
    readonly JOIN_TENANT_ROOM: "join:tenant";
    readonly LEAVE_TENANT_ROOM: "leave:tenant";
};
export declare const CACHE_KEYS: {
    readonly USER_SESSION: (userId: string) => string;
    readonly TENANT_SETTINGS: (tenantId: string) => string;
    readonly METER_PROFILE: (profileId: string) => string;
    readonly DECODER_FUNCTION: (decoderId: string) => string;
    readonly RATE_LIMIT: (key: string) => string;
};
export declare const CACHE_TTL: {
    readonly SHORT: 60;
    readonly MEDIUM: 300;
    readonly LONG: 3600;
    readonly DAY: 86400;
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 30;
    readonly MAX_LIMIT: 100;
};
export declare const SYSTEM_ROLES: {
    readonly PLATFORM_ADMIN: "PLATFORM_ADMIN";
    readonly TENANT_ADMIN: "TENANT_ADMIN";
    readonly OPERATOR: "OPERATOR";
    readonly VIEWER: "VIEWER";
    readonly FIELD_ENGINEER: "FIELD_ENGINEER";
    readonly CUSTOMER: "CUSTOMER";
};
export declare const PERMISSIONS: {
    readonly TENANT_CREATE: "tenant.create";
    readonly TENANT_READ: "tenant.read";
    readonly TENANT_UPDATE: "tenant.update";
    readonly TENANT_DELETE: "tenant.delete";
    readonly USER_CREATE: "user.create";
    readonly USER_READ: "user.read";
    readonly USER_UPDATE: "user.update";
    readonly USER_DELETE: "user.delete";
    readonly METER_CREATE: "meter.create";
    readonly METER_READ: "meter.read";
    readonly METER_UPDATE: "meter.update";
    readonly METER_DELETE: "meter.delete";
    readonly READING_READ: "reading.read";
    readonly READING_EXPORT: "reading.export";
    readonly VALVE_CONTROL: "valve.control";
    readonly CUSTOMER_CREATE: "customer.create";
    readonly CUSTOMER_READ: "customer.read";
    readonly CUSTOMER_UPDATE: "customer.update";
    readonly CUSTOMER_DELETE: "customer.delete";
    readonly PROFILE_CREATE: "profile.create";
    readonly PROFILE_READ: "profile.read";
    readonly PROFILE_UPDATE: "profile.update";
    readonly PROFILE_DELETE: "profile.delete";
    readonly SETTINGS_READ: "settings.read";
    readonly SETTINGS_UPDATE: "settings.update";
};
export declare const ROLE_PERMISSIONS: Record<string, string[]>;
