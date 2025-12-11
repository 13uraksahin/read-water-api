// =============================================================================
// Read Water - Database Seed Script
// =============================================================================
// Seeds the database with:
// 1. Communication Technology Field Definitions (from Functional Specifications 6.8)
// 2. Root Tenant
// 3. Platform Admin User
// 4. Device Profiles with Decoder Functions
// 5. Sample Warehouse Devices
// 6. Sample Meter Profiles with Compatible Device Profiles
// =============================================================================

import 'dotenv/config';
import {
  PrismaClient,
  CommunicationTechnology,
  IntegrationType,
  SystemRole,
  SubscriptionStatus,
  DeviceBrand,
  DeviceStatus,
  Brand,
  MeterType,
  DialType,
  ConnectionType,
  MountingType,
  TemperatureType,
  CommunicationModule,
  IPRating,
} from '@prisma/client';
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
// DEVICE PROFILES - From Section 12 of Functional Specifications
// Decoder functions are now stored here instead of in MeterProfile
// =============================================================================
const deviceProfiles = [
  {
    brand: DeviceBrand.UNA,
    modelCode: 'UNA-LORA-01',
    communicationTechnology: CommunicationTechnology.LORAWAN,
    integrationType: IntegrationType.MQTT,
    fieldDefinitions: [
      { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
      { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
      { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
    ],
    decoderFunction: `
// UNA LoRaWAN Water Meter Decoder
// Expects payload: [4 bytes value] [1 byte battery] [1 byte signal]
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
}`.trim(),
    testPayload: '00015F90640A',
    expectedOutput: { value: 89.488, batteryLevel: 100, signalStrength: 10, unit: 'm3' },
    batteryLifeMonths: 120,
    specifications: { manufacturer: 'Una Technologies', firmware: '1.2.0' },
  },
  {
    brand: DeviceBrand.IMA,
    modelCode: 'IMA-SIGFOX-01',
    communicationTechnology: CommunicationTechnology.SIGFOX,
    integrationType: IntegrationType.HTTP,
    fieldDefinitions: [
      { name: 'ID', type: 'hex', length: 8, regex: '^[a-fA-F0-9]{8}$', required: true },
      { name: 'PAC', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
    ],
    decoderFunction: `
// IMA Sigfox Water Meter Decoder
// Expects 12-byte payload
function decode(payload) {
  const bytes = Buffer.from(payload, 'hex');
  
  // Parse meter value (4 bytes, little-endian, in liters, convert to m³)
  const valueLiters = bytes.readUInt32LE(0);
  const value = valueLiters / 1000;
  
  // Parse battery voltage (2 bytes, mV)
  const batteryMv = bytes.readUInt16LE(4);
  const batteryLevel = Math.min(100, Math.round((batteryMv - 2200) / 14));
  
  return {
    value,
    batteryLevel,
    signalStrength: null,
    unit: 'm3'
  };
}`.trim(),
    testPayload: '905F010000A40D',
    expectedOutput: { value: 89.488, batteryLevel: 100, signalStrength: null, unit: 'm3' },
    batteryLifeMonths: 60,
    specifications: { manufacturer: 'IMA Metering', firmware: '2.1.0' },
  },
  {
    brand: DeviceBrand.ITRON,
    modelCode: 'ITRON-NBIOT-01',
    communicationTechnology: CommunicationTechnology.NB_IOT,
    integrationType: IntegrationType.HTTP,
    fieldDefinitions: [
      { name: 'IMEI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: true },
      { name: 'IMSI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: false },
      { name: 'ICCID', type: 'string', length: 20, regex: '^[0-9]{18,20}$', required: false },
    ],
    decoderFunction: `
// ITRON NB-IoT Water Meter Decoder (JSON payload)
function decode(payload) {
  // ITRON sends JSON payloads
  const data = JSON.parse(payload);
  
  return {
    value: data.meterReading / 1000,
    batteryLevel: data.batteryPercent,
    signalStrength: data.rssi,
    unit: 'm3'
  };
}`.trim(),
    testPayload: '{"meterReading":89488,"batteryPercent":95,"rssi":-85}',
    expectedOutput: { value: 89.488, batteryLevel: 95, signalStrength: -85, unit: 'm3' },
    batteryLifeMonths: 84,
    specifications: { manufacturer: 'Itron Inc.', firmware: '3.0.1' },
  },
  {
    brand: DeviceBrand.ZENNER,
    modelCode: 'ZENNER-WMBUS-01',
    communicationTechnology: CommunicationTechnology.WM_BUS,
    integrationType: IntegrationType.MQTT,
    fieldDefinitions: [
      { name: 'ManufacturerId', type: 'string', length: 3, regex: '^[A-Z]{3}$', required: true },
      { name: 'DeviceId', type: 'hex', length: 8, regex: '^[a-fA-F0-9]{8}$', required: true },
      { name: 'EncryptionKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: false },
    ],
    decoderFunction: `
// ZENNER wM-Bus Water Meter Decoder
function decode(payload) {
  const bytes = Buffer.from(payload, 'hex');
  
  // wM-Bus standard format
  // Skip header (first 12 bytes), value at offset 12
  const value = bytes.readUInt32LE(12) / 1000;
  const batteryLevel = bytes.length > 16 ? bytes.readUInt8(16) : null;
  
  return {
    value,
    batteryLevel,
    signalStrength: null,
    unit: 'm3'
  };
}`.trim(),
    testPayload: '0000000000000000000000009050010064',
    expectedOutput: { value: 89.488, batteryLevel: 100, signalStrength: null, unit: 'm3' },
    batteryLifeMonths: 96,
    specifications: { manufacturer: 'Zenner International', firmware: '1.5.2' },
  },
];

// =============================================================================
// METER PROFILES - From Section 5.1 of Functional Specifications
// =============================================================================
const meterProfiles = [
  {
    brand: Brand.BAYLAN,
    modelCode: 'TK-3S-DN15',
    meterType: MeterType.MULTI_JET,
    dialType: DialType.DRY,
    connectionType: ConnectionType.THREAD,
    mountingType: MountingType.HORIZONTAL,
    temperatureType: TemperatureType.T30,
    diameter: 15,
    length: 165,
    width: 75,
    height: 95,
    q1: 0.01,
    q2: 0.016,
    q3: 2.5,
    q4: 3.125,
    rValue: 250,
    pressureLoss: 0.063,
    ipRating: IPRating.IP68,
    communicationModule: CommunicationModule.RETROFIT,
    specifications: { material: 'Brass', maxPressure: '16 bar' },
  },
  {
    brand: Brand.ZENNER,
    modelCode: 'MTKD-N-DN20',
    meterType: MeterType.MULTI_JET,
    dialType: DialType.SUPER_DRY,
    connectionType: ConnectionType.THREAD,
    mountingType: MountingType.BOTH,
    temperatureType: TemperatureType.T30,
    diameter: 20,
    length: 190,
    width: 80,
    height: 100,
    q1: 0.016,
    q2: 0.025,
    q3: 4.0,
    q4: 5.0,
    rValue: 250,
    pressureLoss: 0.063,
    ipRating: IPRating.IP68,
    communicationModule: CommunicationModule.INTEGRATED,
    specifications: { material: 'Composite', maxPressure: '16 bar' },
  },
  {
    brand: Brand.MANAS,
    modelCode: 'MNS-US-DN25',
    meterType: MeterType.ULTRASONIC,
    dialType: DialType.DRY,
    connectionType: ConnectionType.FLANGE,
    mountingType: MountingType.HORIZONTAL,
    temperatureType: TemperatureType.T30,
    diameter: 25,
    length: 260,
    width: 90,
    height: 110,
    q1: 0.025,
    q2: 0.04,
    q3: 6.3,
    q4: 7.875,
    rValue: 250,
    pressureLoss: 0.025,
    ipRating: IPRating.IP68,
    communicationModule: CommunicationModule.INTEGRATED,
    specifications: { material: 'Stainless Steel', maxPressure: '16 bar', noMovingParts: true },
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
        'device.create',
        'device.read',
        'device.update',
        'device.delete',
        'settings.read',
        'settings.update',
      ],
    },
  });

  console.log(`   ✓ Platform Admin role assigned to ${adminUser.email}`);

  // ---------------------------------------------------------------------------
  // 5. Create Device Profiles (with Decoder Functions)
  // ---------------------------------------------------------------------------
  console.log('\n📱 Creating Device Profiles...');

  const createdDeviceProfiles: Record<string, { id: string; brand: DeviceBrand; modelCode: string }> = {};

  for (const profile of deviceProfiles) {
    const deviceProfile = await prisma.deviceProfile.upsert({
      where: {
        brand_modelCode: {
          brand: profile.brand,
          modelCode: profile.modelCode,
        },
      },
      update: {
        fieldDefinitions: profile.fieldDefinitions,
        decoderFunction: profile.decoderFunction,
        testPayload: profile.testPayload,
        expectedOutput: profile.expectedOutput,
        batteryLifeMonths: profile.batteryLifeMonths,
        specifications: profile.specifications,
        integrationType: profile.integrationType,
      },
      create: {
        brand: profile.brand,
        modelCode: profile.modelCode,
        communicationTechnology: profile.communicationTechnology,
        integrationType: profile.integrationType,
        fieldDefinitions: profile.fieldDefinitions,
        decoderFunction: profile.decoderFunction,
        testPayload: profile.testPayload,
        expectedOutput: profile.expectedOutput,
        batteryLifeMonths: profile.batteryLifeMonths,
        specifications: profile.specifications,
      },
    });
    createdDeviceProfiles[`${profile.brand}-${profile.modelCode}`] = {
      id: deviceProfile.id,
      brand: profile.brand,
      modelCode: profile.modelCode,
    };
    console.log(`   ✓ ${profile.brand} ${profile.modelCode} (${profile.communicationTechnology})`);
  }

  // ---------------------------------------------------------------------------
  // 6. Create Meter Profiles
  // ---------------------------------------------------------------------------
  console.log('\n📊 Creating Meter Profiles...');

  const createdMeterProfiles: Record<string, { id: string; brand: Brand; modelCode: string }> = {};

  for (const profile of meterProfiles) {
    const meterProfile = await prisma.meterProfile.upsert({
      where: {
        brand_modelCode: {
          brand: profile.brand,
          modelCode: profile.modelCode,
        },
      },
      update: {
        specifications: profile.specifications,
      },
      create: {
        brand: profile.brand,
        modelCode: profile.modelCode,
        meterType: profile.meterType,
        dialType: profile.dialType,
        connectionType: profile.connectionType,
        mountingType: profile.mountingType,
        temperatureType: profile.temperatureType,
        diameter: profile.diameter,
        length: profile.length,
        width: profile.width,
        height: profile.height,
        q1: profile.q1,
        q2: profile.q2,
        q3: profile.q3,
        q4: profile.q4,
        rValue: profile.rValue,
        pressureLoss: profile.pressureLoss,
        ipRating: profile.ipRating,
        communicationModule: profile.communicationModule,
        specifications: profile.specifications,
      },
    });
    createdMeterProfiles[`${profile.brand}-${profile.modelCode}`] = {
      id: meterProfile.id,
      brand: profile.brand,
      modelCode: profile.modelCode,
    };
    console.log(`   ✓ ${profile.brand} ${profile.modelCode}`);
  }

  // ---------------------------------------------------------------------------
  // 7. Create Compatible Device Profile Relationships
  // ---------------------------------------------------------------------------
  console.log('\n🔗 Creating Compatible Device Profile Relationships...');

  // BAYLAN meters are compatible with UNA and IMA devices
  const baylanProfile = createdMeterProfiles['BAYLAN-TK-3S-DN15'];
  const unaProfile = createdDeviceProfiles['UNA-UNA-LORA-01'];
  const imaProfile = createdDeviceProfiles['IMA-IMA-SIGFOX-01'];

  if (baylanProfile && unaProfile) {
    await prisma.meterProfile.update({
      where: { id: baylanProfile.id },
      data: {
        compatibleDeviceProfiles: {
          connect: [{ id: unaProfile.id }],
        },
      },
    });
    console.log(`   ✓ BAYLAN TK-3S-DN15 <-> UNA UNA-LORA-01`);
  }

  if (baylanProfile && imaProfile) {
    await prisma.meterProfile.update({
      where: { id: baylanProfile.id },
      data: {
        compatibleDeviceProfiles: {
          connect: [{ id: imaProfile.id }],
        },
      },
    });
    console.log(`   ✓ BAYLAN TK-3S-DN15 <-> IMA IMA-SIGFOX-01`);
  }

  // ZENNER meters are compatible with ZENNER wM-Bus and ITRON NB-IoT devices
  const zennerMeterProfile = createdMeterProfiles['ZENNER-MTKD-N-DN20'];
  const zennerDeviceProfile = createdDeviceProfiles['ZENNER-ZENNER-WMBUS-01'];
  const itronProfile = createdDeviceProfiles['ITRON-ITRON-NBIOT-01'];

  if (zennerMeterProfile && zennerDeviceProfile) {
    await prisma.meterProfile.update({
      where: { id: zennerMeterProfile.id },
      data: {
        compatibleDeviceProfiles: {
          connect: [{ id: zennerDeviceProfile.id }],
        },
      },
    });
    console.log(`   ✓ ZENNER MTKD-N-DN20 <-> ZENNER ZENNER-WMBUS-01`);
  }

  if (zennerMeterProfile && itronProfile) {
    await prisma.meterProfile.update({
      where: { id: zennerMeterProfile.id },
      data: {
        compatibleDeviceProfiles: {
          connect: [{ id: itronProfile.id }],
        },
      },
    });
    console.log(`   ✓ ZENNER MTKD-N-DN20 <-> ITRON ITRON-NBIOT-01`);
  }

  // MANAS ultrasonic meters are compatible with all device profiles
  const manasProfile = createdMeterProfiles['MANAS-MNS-US-DN25'];
  if (manasProfile) {
    const allDeviceProfileIds = Object.values(createdDeviceProfiles).map(p => ({ id: p.id }));
    await prisma.meterProfile.update({
      where: { id: manasProfile.id },
      data: {
        compatibleDeviceProfiles: {
          connect: allDeviceProfileIds,
        },
      },
    });
    console.log(`   ✓ MANAS MNS-US-DN25 <-> All Device Profiles`);
  }

  // ---------------------------------------------------------------------------
  // 8. Create Sample Warehouse Devices
  // ---------------------------------------------------------------------------
  console.log('\n📦 Creating Sample Warehouse Devices...');

  // Get device profile IDs
  const unaDeviceProfileId = Object.values(createdDeviceProfiles).find(p => p.brand === DeviceBrand.UNA)?.id;
  const imaDeviceProfileId = Object.values(createdDeviceProfiles).find(p => p.brand === DeviceBrand.IMA)?.id;
  const itronDeviceProfileId = Object.values(createdDeviceProfiles).find(p => p.brand === DeviceBrand.ITRON)?.id;
  const zennerDeviceProfileId = Object.values(createdDeviceProfiles).find(p => p.brand === DeviceBrand.ZENNER)?.id;

  const warehouseDevices = [
    // UNA LoRaWAN devices
    ...(unaDeviceProfileId
      ? [
          {
            serialNumber: 'UNA-LW-001',
            deviceProfileId: unaDeviceProfileId,
            dynamicFields: {
              DevEUI: '0011223344556677',
              JoinEUI: 'AABBCCDD11223344',
              AppKey: '00112233445566778899AABBCCDDEEFF',
            },
          },
          {
            serialNumber: 'UNA-LW-002',
            deviceProfileId: unaDeviceProfileId,
            dynamicFields: {
              DevEUI: '1122334455667788',
              JoinEUI: 'AABBCCDD11223344',
              AppKey: '11223344556677889900AABBCCDDEEFF',
            },
          },
          {
            serialNumber: 'UNA-LW-003',
            deviceProfileId: unaDeviceProfileId,
            dynamicFields: {
              DevEUI: '2233445566778899',
              JoinEUI: 'AABBCCDD11223344',
              AppKey: '22334455667788990011AABBCCDDEEFF',
            },
          },
        ]
      : []),
    // IMA Sigfox devices
    ...(imaDeviceProfileId
      ? [
          {
            serialNumber: 'IMA-SF-001',
            deviceProfileId: imaDeviceProfileId,
            dynamicFields: {
              ID: 'AABBCCDD',
              PAC: '1122334455667788',
            },
          },
          {
            serialNumber: 'IMA-SF-002',
            deviceProfileId: imaDeviceProfileId,
            dynamicFields: {
              ID: 'EEFF0011',
              PAC: '2233445566778899',
            },
          },
        ]
      : []),
    // ITRON NB-IoT devices
    ...(itronDeviceProfileId
      ? [
          {
            serialNumber: 'ITRON-NB-001',
            deviceProfileId: itronDeviceProfileId,
            dynamicFields: {
              IMEI: '123456789012345',
              IMSI: '234567890123456',
              ICCID: '89012345678901234567',
            },
          },
          {
            serialNumber: 'ITRON-NB-002',
            deviceProfileId: itronDeviceProfileId,
            dynamicFields: {
              IMEI: '234567890123456',
              IMSI: '345678901234567',
              ICCID: '89123456789012345678',
            },
          },
        ]
      : []),
    // ZENNER wM-Bus devices
    ...(zennerDeviceProfileId
      ? [
          {
            serialNumber: 'ZEN-WMB-001',
            deviceProfileId: zennerDeviceProfileId,
            dynamicFields: {
              ManufacturerId: 'ZEN',
              DeviceId: 'AABBCCDD',
              EncryptionKey: '00112233445566778899AABBCCDDEEFF',
            },
          },
          {
            serialNumber: 'ZEN-WMB-002',
            deviceProfileId: zennerDeviceProfileId,
            dynamicFields: {
              ManufacturerId: 'ZEN',
              DeviceId: 'EEFF0011',
              EncryptionKey: '11223344556677889900AABBCCDDEEFF',
            },
          },
        ]
      : []),
  ];

  for (const device of warehouseDevices) {
    await prisma.device.upsert({
      where: { serialNumber: device.serialNumber },
      update: {
        dynamicFields: device.dynamicFields,
      },
      create: {
        serialNumber: device.serialNumber,
        tenantId: rootTenant.id,
        deviceProfileId: device.deviceProfileId,
        status: DeviceStatus.WAREHOUSE,
        dynamicFields: device.dynamicFields,
        metadata: {
          createdBy: 'seed',
          batchNumber: 'SEED-2024-001',
        },
      },
    });
    console.log(`   ✓ ${device.serialNumber} (WAREHOUSE)`);
  }

  // ---------------------------------------------------------------------------
  // 9. Create Global Settings
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
  console.log('\n' + '='.repeat(70));
  console.log('🎉 Database seed completed successfully!\n');
  console.log('Summary:');
  console.log(`   • Communication Tech Definitions: ${communicationTechFieldDefs.length}`);
  console.log(`   • Root Tenant: ${rootTenant.name}`);
  console.log(`   • Platform Admin: ${adminUser.email}`);
  console.log(`   • Default Password: Admin@123 (CHANGE IN PRODUCTION!)`);
  console.log(`   • Device Profiles: ${deviceProfiles.length}`);
  console.log(`   • Meter Profiles: ${meterProfiles.length}`);
  console.log(`   • Warehouse Devices: ${warehouseDevices.length}`);
  console.log(`   • Global Settings: ${globalSettings.length}`);
  console.log('='.repeat(70) + '\n');
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
