// =============================================================================
// Application Constants
// =============================================================================

// Queue Names
export const QUEUES = {
  READINGS: 'readings-queue',
  ALARMS: 'alarms-queue',
  NOTIFICATIONS: 'notifications-queue',
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  // Reading events
  READING_NEW: 'reading:new',
  READING_BATCH: 'reading:batch',
  
  // Alarm events
  ALARM_NEW: 'alarm:new',
  ALARM_UPDATED: 'alarm:updated',
  ALARM_RESOLVED: 'alarm:resolved',
  
  // Meter events
  METER_STATUS_CHANGED: 'meter:status-changed',
  METER_VALVE_CHANGED: 'meter:valve-changed',
  
  // Device events
  DEVICE_STATUS_CHANGED: 'device:status-changed',
  DEVICE_LINKED: 'device:linked',
  DEVICE_UNLINKED: 'device:unlinked',
  
  // Dashboard events
  DASHBOARD_UPDATE: 'dashboard:update',
  
  // Connection events
  CLIENT_CONNECTED: 'client:connected',
  CLIENT_DISCONNECTED: 'client:disconnected',
  
  // Room management
  JOIN_TENANT_ROOM: 'join:tenant',
  LEAVE_TENANT_ROOM: 'leave:tenant',
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  TENANT_SETTINGS: (tenantId: string) => `tenant:${tenantId}:settings`,
  METER_PROFILE: (profileId: string) => `profile:${profileId}`,
  DEVICE_PROFILE: (profileId: string) => `device-profile:${profileId}`,
  DECODER_FUNCTION: (decoderId: string) => `decoder:${decoderId}`,
  DEVICE_LOOKUP: (technology: string, deviceId: string) => `device:${technology}:${deviceId}`,
  RATE_LIMIT: (key: string) => `ratelimit:${key}`,
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 30,
  MAX_LIMIT: 100,
} as const;

// System roles (matching Prisma enum)
export const SYSTEM_ROLES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER',
  FIELD_ENGINEER: 'FIELD_ENGINEER',
  CUSTOMER: 'CUSTOMER',
} as const;

// Permissions
export const PERMISSIONS = {
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
  // Device permissions
  DEVICE_CREATE: 'device.create',
  DEVICE_READ: 'device.read',
  DEVICE_UPDATE: 'device.update',
  DEVICE_DELETE: 'device.delete',
  // Reading permissions
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
} as const;

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [SYSTEM_ROLES.PLATFORM_ADMIN]: Object.values(PERMISSIONS),
  [SYSTEM_ROLES.TENANT_ADMIN]: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.METER_CREATE,
    PERMISSIONS.METER_READ,
    PERMISSIONS.METER_UPDATE,
    PERMISSIONS.METER_DELETE,
    PERMISSIONS.DEVICE_CREATE,
    PERMISSIONS.DEVICE_READ,
    PERMISSIONS.DEVICE_UPDATE,
    PERMISSIONS.DEVICE_DELETE,
    PERMISSIONS.READING_READ,
    PERMISSIONS.READING_EXPORT,
    PERMISSIONS.VALVE_CONTROL,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
  ],
  [SYSTEM_ROLES.OPERATOR]: [
    PERMISSIONS.METER_CREATE,
    PERMISSIONS.METER_READ,
    PERMISSIONS.METER_UPDATE,
    PERMISSIONS.DEVICE_CREATE,
    PERMISSIONS.DEVICE_READ,
    PERMISSIONS.DEVICE_UPDATE,
    PERMISSIONS.READING_READ,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
  ],
  [SYSTEM_ROLES.VIEWER]: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.USER_READ,
    PERMISSIONS.METER_READ,
    PERMISSIONS.DEVICE_READ,
    PERMISSIONS.READING_READ,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.PROFILE_READ,
  ],
  [SYSTEM_ROLES.FIELD_ENGINEER]: [
    PERMISSIONS.METER_READ,
    PERMISSIONS.METER_UPDATE,
    PERMISSIONS.DEVICE_READ,
    PERMISSIONS.DEVICE_UPDATE,
    PERMISSIONS.READING_READ,
  ],
  [SYSTEM_ROLES.CUSTOMER]: [
    PERMISSIONS.READING_READ,
    PERMISSIONS.METER_READ,
  ],
};
