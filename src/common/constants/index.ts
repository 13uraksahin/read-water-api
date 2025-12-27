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

// Permission modules (for frontend navigation)
export const MODULES = {
  DASHBOARD: 'dashboard',
  READINGS: 'reading',
  SUBSCRIPTIONS: 'subscription',
  CUSTOMERS: 'customer',
  METERS: 'meter',
  DEVICES: 'device',
  PROFILES: 'profile',
  ALARMS: 'alarm',
  TENANTS: 'tenant',
  USERS: 'user',
  SETTINGS: 'settings',
  DECODERS: 'decoder',
} as const;

// Permissions
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_READ: 'dashboard.read',
  
  // Tenant permissions
  TENANT_CREATE: 'tenant.create',
  TENANT_READ: 'tenant.read',
  TENANT_UPDATE: 'tenant.update',
  TENANT_DELETE: 'tenant.delete',
  
  // User permissions
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // Meter permissions
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
  
  // Valve control
  VALVE_CONTROL: 'valve.control',
  
  // Customer permissions
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',
  
  // Subscription permissions
  SUBSCRIPTION_CREATE: 'subscription.create',
  SUBSCRIPTION_READ: 'subscription.read',
  SUBSCRIPTION_UPDATE: 'subscription.update',
  SUBSCRIPTION_DELETE: 'subscription.delete',
  
  // Profile permissions
  PROFILE_CREATE: 'profile.create',
  PROFILE_READ: 'profile.read',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_DELETE: 'profile.delete',
  
  // Decoder permissions
  DECODER_CREATE: 'decoder.create',
  DECODER_READ: 'decoder.read',
  DECODER_UPDATE: 'decoder.update',
  DECODER_DELETE: 'decoder.delete',
  
  // Alarm permissions
  ALARM_READ: 'alarm.read',
  ALARM_UPDATE: 'alarm.update',
  ALARM_ACKNOWLEDGE: 'alarm.acknowledge',
  ALARM_RESOLVE: 'alarm.resolve',
  
  // Settings permissions
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
} as const;

// Permission type
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [SYSTEM_ROLES.PLATFORM_ADMIN]: Object.values(PERMISSIONS),
  [SYSTEM_ROLES.TENANT_ADMIN]: [
    // Dashboard
    PERMISSIONS.DASHBOARD_READ,
    // Tenant (limited)
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_UPDATE,
    // Users
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    // Meters
    PERMISSIONS.METER_CREATE,
    PERMISSIONS.METER_READ,
    PERMISSIONS.METER_UPDATE,
    PERMISSIONS.METER_DELETE,
    // Devices
    PERMISSIONS.DEVICE_CREATE,
    PERMISSIONS.DEVICE_READ,
    PERMISSIONS.DEVICE_UPDATE,
    PERMISSIONS.DEVICE_DELETE,
    // Readings
    PERMISSIONS.READING_READ,
    PERMISSIONS.READING_EXPORT,
    PERMISSIONS.VALVE_CONTROL,
    // Customers
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
    // Subscriptions
    PERMISSIONS.SUBSCRIPTION_CREATE,
    PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.SUBSCRIPTION_UPDATE,
    PERMISSIONS.SUBSCRIPTION_DELETE,
    // Profiles (read only)
    PERMISSIONS.PROFILE_READ,
    // Decoders (read only)
    PERMISSIONS.DECODER_READ,
    // Alarms
    PERMISSIONS.ALARM_READ,
    PERMISSIONS.ALARM_UPDATE,
    PERMISSIONS.ALARM_ACKNOWLEDGE,
    PERMISSIONS.ALARM_RESOLVE,
    // Settings
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
  ],
  [SYSTEM_ROLES.OPERATOR]: [
    // Dashboard
    PERMISSIONS.DASHBOARD_READ,
    // Meters
    PERMISSIONS.METER_CREATE,
    PERMISSIONS.METER_READ,
    PERMISSIONS.METER_UPDATE,
    // Devices
    PERMISSIONS.DEVICE_CREATE,
    PERMISSIONS.DEVICE_READ,
    PERMISSIONS.DEVICE_UPDATE,
    // Readings
    PERMISSIONS.READING_READ,
    // Customers
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    // Subscriptions
    PERMISSIONS.SUBSCRIPTION_CREATE,
    PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.SUBSCRIPTION_UPDATE,
    // Profiles (read only)
    PERMISSIONS.PROFILE_READ,
    // Decoders (read only)
    PERMISSIONS.DECODER_READ,
    // Alarms
    PERMISSIONS.ALARM_READ,
    PERMISSIONS.ALARM_UPDATE,
  ],
  [SYSTEM_ROLES.VIEWER]: [
    // Dashboard
    PERMISSIONS.DASHBOARD_READ,
    // Tenant (read only)
    PERMISSIONS.TENANT_READ,
    // User (read only)
    PERMISSIONS.USER_READ,
    // Meters (read only)
    PERMISSIONS.METER_READ,
    // Devices (read only)
    PERMISSIONS.DEVICE_READ,
    // Readings
    PERMISSIONS.READING_READ,
    // Customers (read only)
    PERMISSIONS.CUSTOMER_READ,
    // Subscriptions (read only)
    PERMISSIONS.SUBSCRIPTION_READ,
    // Profiles (read only)
    PERMISSIONS.PROFILE_READ,
    // Decoders (read only)
    PERMISSIONS.DECODER_READ,
    // Alarms (read only)
    PERMISSIONS.ALARM_READ,
  ],
  [SYSTEM_ROLES.FIELD_ENGINEER]: [
    // Dashboard
    PERMISSIONS.DASHBOARD_READ,
    // Meters
    PERMISSIONS.METER_READ,
    PERMISSIONS.METER_UPDATE,
    // Devices
    PERMISSIONS.DEVICE_READ,
    PERMISSIONS.DEVICE_UPDATE,
    // Readings
    PERMISSIONS.READING_READ,
    // Subscriptions (read only)
    PERMISSIONS.SUBSCRIPTION_READ,
    // Alarms
    PERMISSIONS.ALARM_READ,
    PERMISSIONS.ALARM_ACKNOWLEDGE,
  ],
  [SYSTEM_ROLES.CUSTOMER]: [
    // Dashboard (limited)
    PERMISSIONS.DASHBOARD_READ,
    // Readings (own)
    PERMISSIONS.READING_READ,
    // Meters (own)
    PERMISSIONS.METER_READ,
    // Subscriptions (own)
    PERMISSIONS.SUBSCRIPTION_READ,
    // Alarms (own)
    PERMISSIONS.ALARM_READ,
  ],
};

// Helper to get permissions for a role
export const getPermissionsForRole = (role: string): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};

// Helper to check if a permission is in a list
export const hasPermission = (
  permissions: string[],
  requiredPermission: string,
): boolean => {
  return permissions.includes(requiredPermission);
};

// Helper to check if any permission matches
export const hasAnyPermission = (
  permissions: string[],
  requiredPermissions: string[],
): boolean => {
  return requiredPermissions.some((p) => permissions.includes(p));
};

// Helper to check if all permissions match
export const hasAllPermissions = (
  permissions: string[],
  requiredPermissions: string[],
): boolean => {
  return requiredPermissions.every((p) => permissions.includes(p));
};
