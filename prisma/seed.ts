// =============================================================================
// Read Water - Database Seed Script
// =============================================================================
// Seeds the database with:
// 1. Communication Technology Field Definitions (from Functional Specifications 6.8)
// 2. Root Tenant
// 3. Platform Admin User
// =============================================================================

import 'dotenv/config';
import { PrismaClient, CommunicationTechnology, IntegrationType, SystemRole, SubscriptionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Initialize Prisma Client
const prisma = new PrismaClient();

// =============================================================================
// COMMUNICATION TECHNOLOGY FIELD DEFINITIONS
// From Section 6.8 of Functional Specifications
// =============================================================================
const communicationTechFieldDefs = [
  {
    technology: CommunicationTechnology.SIGFOX,
    integrationTypes: [IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'ID',
        label: 'Sigfox ID',
        type: 'hex',
        length: 8,
        regex: '^[a-fA-F0-9]{8}$',
        required: true,
        description: 'Sigfox device ID (8 hex characters)',
      },
      {
        name: 'PAC',
        label: 'PAC',
        type: 'hex',
        length: 16,
        regex: '^[a-fA-F0-9]{16}$',
        required: true,
        description: 'Porting Authorization Code (16 hex characters)',
      },
    ],
  },
  {
    technology: CommunicationTechnology.LORAWAN,
    integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'DevEUI',
        label: 'Device EUI',
        type: 'hex',
        length: 16,
        regex: '^[a-fA-F0-9]{16}$',
        required: true,
        description: 'Device Extended Unique Identifier (16 hex characters)',
      },
      {
        name: 'JoinEUI',
        label: 'Join EUI',
        type: 'hex',
        length: 16,
        regex: '^[a-fA-F0-9]{16}$',
        required: true,
        description: 'Join Server EUI (16 hex characters)',
      },
      {
        name: 'AppKey',
        label: 'Application Key',
        type: 'hex',
        length: 32,
        regex: '^[a-fA-F0-9]{32}$',
        required: true,
        description: 'Application Key for OTAA (32 hex characters)',
      },
    ],
  },
  {
    technology: CommunicationTechnology.NB_IOT,
    integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'IMEI',
        label: 'IMEI',
        type: 'string',
        length: 15,
        regex: '^[0-9]{15}$',
        required: true,
        description: 'International Mobile Equipment Identity (15 digits)',
      },
      {
        name: 'IMSI',
        label: 'IMSI',
        type: 'string',
        length: 15,
        regex: '^[0-9]{15}$',
        required: false,
        description: 'International Mobile Subscriber Identity (15 digits)',
      },
      {
        name: 'ICCID',
        label: 'SIM ICCID',
        type: 'string',
        length: 20,
        regex: '^[0-9]{18,20}$',
        required: false,
        description: 'Integrated Circuit Card Identifier (18-20 digits)',
      },
    ],
  },
  {
    technology: CommunicationTechnology.WM_BUS,
    integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'ManufacturerId',
        label: 'Manufacturer ID',
        type: 'string',
        length: 3,
        regex: '^[A-Z]{3}$',
        required: true,
        description: 'Manufacturer ID (3 uppercase letters)',
      },
      {
        name: 'DeviceId',
        label: 'Device ID',
        type: 'hex',
        length: 8,
        regex: '^[a-fA-F0-9]{8}$',
        required: true,
        description: 'wM-Bus device ID (8 hex characters)',
      },
      {
        name: 'EncryptionKey',
        label: 'Encryption Key',
        type: 'hex',
        length: 32,
        regex: '^[a-fA-F0-9]{32}$',
        required: false,
        description: 'AES-128 encryption key (32 hex characters)',
      },
    ],
  },
  {
    technology: CommunicationTechnology.MIOTY,
    integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'ShortAddress',
        label: 'Short Address',
        type: 'hex',
        length: 8,
        regex: '^[a-fA-F0-9]{8}$',
        required: true,
        description: 'Mioty short address (8 hex characters)',
      },
      {
        name: 'EUI64',
        label: 'EUI-64',
        type: 'hex',
        length: 16,
        regex: '^[a-fA-F0-9]{16}$',
        required: true,
        description: 'Extended unique identifier (16 hex characters)',
      },
    ],
  },
  {
    technology: CommunicationTechnology.WIFI,
    integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'MacAddress',
        label: 'MAC Address',
        type: 'string',
        length: 17,
        regex: '^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$',
        required: true,
        description: 'WiFi MAC address (format: XX:XX:XX:XX:XX:XX)',
      },
      {
        name: 'SSID',
        label: 'SSID',
        type: 'string',
        length: 32,
        regex: '^.{1,32}$',
        required: false,
        description: 'Network SSID (up to 32 characters)',
      },
    ],
  },
  {
    technology: CommunicationTechnology.BLUETOOTH,
    integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'MacAddress',
        label: 'BLE MAC Address',
        type: 'string',
        length: 17,
        regex: '^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$',
        required: true,
        description: 'Bluetooth MAC address (format: XX:XX:XX:XX:XX:XX)',
      },
      {
        name: 'ServiceUUID',
        label: 'Service UUID',
        type: 'string',
        length: 36,
        regex: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
        required: false,
        description: 'BLE service UUID',
      },
    ],
  },
  {
    technology: CommunicationTechnology.NFC,
    integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'UID',
        label: 'NFC UID',
        type: 'hex',
        length: 14,
        regex: '^[a-fA-F0-9]{4,14}$',
        required: true,
        description: 'NFC unique identifier (4-14 hex characters)',
      },
    ],
  },
  {
    technology: CommunicationTechnology.OMS,
    integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
    fields: [
      {
        name: 'ManufacturerId',
        label: 'Manufacturer ID',
        type: 'string',
        length: 3,
        regex: '^[A-Z]{3}$',
        required: true,
        description: 'Manufacturer ID (3 uppercase letters)',
      },
      {
        name: 'DeviceId',
        label: 'Device ID',
        type: 'hex',
        length: 8,
        regex: '^[a-fA-F0-9]{8}$',
        required: true,
        description: 'OMS device ID (8 hex characters)',
      },
      {
        name: 'EncryptionKey',
        label: 'Encryption Key',
        type: 'hex',
        length: 32,
        regex: '^[a-fA-F0-9]{32}$',
        required: false,
        description: 'AES-128 encryption key (32 hex characters)',
      },
    ],
  },
];

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================
async function main() {
  console.log('🌱 Starting database seed...\n');

  // ---------------------------------------------------------------------------
  // 1. Seed Communication Technology Field Definitions
  // ---------------------------------------------------------------------------
  console.log('📡 Seeding Communication Technology Field Definitions...');
  
  for (const techDef of communicationTechFieldDefs) {
    await prisma.communicationTechFieldDef.upsert({
      where: { technology: techDef.technology },
      update: {
        fields: techDef.fields,
        integrationTypes: techDef.integrationTypes,
      },
      create: {
        technology: techDef.technology,
        fields: techDef.fields,
        integrationTypes: techDef.integrationTypes,
      },
    });
    console.log(`   ✓ ${techDef.technology}`);
  }

  // ---------------------------------------------------------------------------
  // 2. Create Root Tenant
  // ---------------------------------------------------------------------------
  console.log('\n🏢 Creating Root Tenant...');

  const rootTenant = await prisma.tenant.upsert({
    where: { path: 'Root' },
    update: {},
    create: {
      path: 'Root',
      name: 'Read Water Platform',
      contactFirstName: 'System',
      contactLastName: 'Administrator',
      contactEmail: 'admin@readwater.io',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionPlan: 'enterprise',
      address: {
        city: 'Istanbul',
        district: 'Kadıköy',
        neighborhood: 'Caferağa',
        street: 'Moda Caddesi',
        buildingNo: '1',
        floor: '1',
        doorNo: '1',
        postalCode: '34710',
        extraDetails: 'Read Water Platform Headquarters',
      },
      settings: {
        theme: 'light',
        language: 'en',
        timezone: 'Europe/Istanbul',
      },
    },
  });

  console.log(`   ✓ Root Tenant created: ${rootTenant.name} (${rootTenant.id})`);

  // ---------------------------------------------------------------------------
  // 3. Create Platform Admin User
  // ---------------------------------------------------------------------------
  console.log('\n👤 Creating Platform Admin User...');

  // Hash password: "Admin@123" (change in production!)
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('Admin@123', saltRounds);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@readwater.io' },
    update: {
      passwordHash,
    },
    create: {
      firstName: 'Platform',
      lastName: 'Admin',
      email: 'admin@readwater.io',
      phone: '+905001234567',
      passwordHash,
      isActive: true,
      language: 'en',
      timezone: 'Europe/Istanbul',
      metadata: {
        createdBy: 'seed',
        isSystemUser: true,
      },
    },
  });

  console.log(`   ✓ Admin User created: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);

  // ---------------------------------------------------------------------------
  // 4. Assign Platform Admin Role to Root Tenant
  // ---------------------------------------------------------------------------
  console.log('\n🔑 Assigning Platform Admin role...');

  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: adminUser.id,
        tenantId: rootTenant.id,
      },
    },
    update: {
      role: SystemRole.PLATFORM_ADMIN,
    },
    create: {
      userId: adminUser.id,
      tenantId: rootTenant.id,
      role: SystemRole.PLATFORM_ADMIN,
      permissions: [
        'tenant.create',
        'tenant.read',
        'tenant.update',
        'tenant.delete',
        'user.create',
        'user.read',
        'user.update',
        'user.delete',
        'meter.create',
        'meter.read',
        'meter.update',
        'meter.delete',
        'reading.read',
        'reading.export',
        'valve.control',
        'customer.create',
        'customer.read',
        'customer.update',
        'customer.delete',
        'profile.create',
        'profile.read',
        'profile.update',
        'profile.delete',
        'settings.read',
        'settings.update',
      ],
    },
  });

  console.log(`   ✓ Platform Admin role assigned to ${adminUser.email}`);

  // ---------------------------------------------------------------------------
  // 5. Create Sample Decoder Function
  // ---------------------------------------------------------------------------
  console.log('\n📝 Creating Sample Decoder Function...');

  await prisma.decoderFunction.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'LoRaWAN Generic Decoder',
      description: 'Generic decoder for LoRaWAN water meter payloads (hex to decimal)',
      communicationTechnology: CommunicationTechnology.LORAWAN,
      code: `
// Generic LoRaWAN Water Meter Decoder
// Expects payload: [4 bytes value] [2 bytes battery] [2 bytes signal]
function decode(payload) {
  const bytes = Buffer.from(payload, 'hex');
  
  // Parse meter value (4 bytes, big-endian, divided by 1000 for m³)
  const value = bytes.readUInt32BE(0) / 1000;
  
  // Parse battery level (1 byte, percentage)
  const batteryLevel = bytes.length > 4 ? bytes.readUInt8(4) : null;
  
  // Parse signal strength (1 byte, signed, dBm)
  const signalStrength = bytes.length > 5 ? bytes.readInt8(5) : null;
  
  return {
    value,
    batteryLevel,
    signalStrength,
    unit: 'm3'
  };
}
`.trim(),
      version: 1,
      isActive: true,
      testPayload: '00015F90640A',
      expectedOutput: {
        value: 89.488,
        batteryLevel: 100,
        signalStrength: 10,
        unit: 'm3',
      },
      metadata: {
        author: 'system',
        category: 'water-meter',
      },
    },
  });

  console.log('   ✓ Sample LoRaWAN decoder created');

  // ---------------------------------------------------------------------------
  // 6. Create Global Settings
  // ---------------------------------------------------------------------------
  console.log('\n⚙️  Creating Global Settings...');

  const globalSettings = [
    {
      key: 'platform.name',
      value: { name: 'Read Water', displayName: 'Read Water Platform' },
      category: 'branding',
    },
    {
      key: 'platform.title',
      value: { title: 'Remote Water Meter Reading Platform' },
      category: 'branding',
    },
    {
      key: 'platform.description',
      value: { description: 'High-performance, multi-tenant water meter reading platform' },
      category: 'branding',
    },
    {
      key: 'platform.supportedLanguages',
      value: { languages: ['en', 'tr', 'fr'] },
      category: 'i18n',
    },
    {
      key: 'platform.defaultLanguage',
      value: { language: 'en' },
      category: 'i18n',
    },
    {
      key: 'readings.pageSize',
      value: { pageSize: 30 },
      category: 'pagination',
    },
  ];

  for (const setting of globalSettings) {
    await prisma.setting.upsert({
      where: {
        tenantId_key: {
          tenantId: rootTenant.id,
          key: setting.key,
        },
      },
      update: { value: setting.value },
      create: {
        tenantId: rootTenant.id,
        key: setting.key,
        value: setting.value,
        category: setting.category,
      },
    });
    console.log(`   ✓ ${setting.key}`);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Database seed completed successfully!\n');
  console.log('Summary:');
  console.log(`   • Communication Tech Definitions: ${communicationTechFieldDefs.length}`);
  console.log(`   • Root Tenant: ${rootTenant.name}`);
  console.log(`   • Platform Admin: ${adminUser.email}`);
  console.log(`   • Default Password: Admin@123 (CHANGE IN PRODUCTION!)`);
  console.log(`   • Global Settings: ${globalSettings.length}`);
  console.log('='.repeat(60) + '\n');
}

// =============================================================================
// RUN SEED
// =============================================================================
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

