// =============================================================================
// Read Water - Seed 2 Script (Development/Demo Environment)
// =============================================================================
// SEED 2: Lighter dataset for development and demos
// - 100 meters per batch (1,700 total)
// - 45 days of readings (24 readings/day)
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
  MeterStatus,
  CustomerType,
  ConsumptionType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================
const BATCH_SIZE = 100;
const PASSWORD = 'Asdf1234.';
const SALT_ROUNDS = 10;

// Hatay coordinates (for HATSU)
const HATSU_BASE_LAT = 36.2025;
const HATSU_BASE_LNG = 36.1601;

// Ankara coordinates (for ASKİ)
const ASKI_BASE_LAT = 39.9334;
const ASKI_BASE_LNG = 32.8597;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate random coordinates within a radius
 */
function randomCoordinate(baseLat: number, baseLng: number, radiusKm = 10): { lat: number; lng: number } {
  const radiusDeg = radiusKm / 111; // ~111km per degree
  const lat = baseLat + (Math.random() - 0.5) * 2 * radiusDeg;
  const lng = baseLng + (Math.random() - 0.5) * 2 * radiusDeg;
  return { lat: parseFloat(lat.toFixed(8)), lng: parseFloat(lng.toFixed(8)) };
}

/**
 * Generate a random hex string of given length
 */
function randomHex(length: number): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate a unique serial number
 */
function generateSerial(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(6, '0')}`;
}

/**
 * Process items in batches with transaction
 */
async function processBatch<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>,
  label: string
): Promise<void> {
  const totalBatches = Math.ceil(items.length / batchSize);
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    process.stdout.write(`\r   Processing ${label}: Batch ${batchNum}/${totalBatches} (${Math.min(i + batchSize, items.length)}/${items.length})`);
    await processor(batch);
  }
  console.log(` ✓`);
}

// =============================================================================
// PART A: TEARDOWN (Clean Old Data)
// =============================================================================
async function teardown(): Promise<void> {
  console.log('\n🧹 PART A: TEARDOWN - Cleaning existing data...\n');

  // Order matters for FK constraints
  const teardownSteps = [
    { name: 'Readings', action: async () => { await prisma.$executeRawUnsafe('TRUNCATE TABLE "readings" CASCADE;'); }},
    { name: 'Alarms', action: async () => { await prisma.alarm.deleteMany(); }},
    { name: 'ActivityLogs', action: async () => { await prisma.activityLog.deleteMany(); }},
    { name: 'Meters', action: async () => { await prisma.meter.deleteMany(); }},
    { name: 'Devices', action: async () => { await prisma.device.deleteMany(); }},
    { name: 'Customers', action: async () => { await prisma.customer.deleteMany(); }},
    { name: 'RefreshTokens', action: async () => { await prisma.refreshToken.deleteMany(); }},
    { name: 'UserTenants', action: async () => { await prisma.userTenant.deleteMany(); }},
    { name: 'Users', action: async () => { await prisma.user.deleteMany(); }},
    { name: 'Settings', action: async () => { await prisma.setting.deleteMany(); }},
    { name: 'MeterProfiles (disconnect relations)', action: async () => { 
      await prisma.$executeRawUnsafe('DELETE FROM "_TenantAllowedProfiles";');
      await prisma.$executeRawUnsafe('DELETE FROM "_CompatibleDeviceProfiles";');
    }},
    { name: 'MeterProfiles', action: async () => { await prisma.meterProfile.deleteMany(); }},
    { name: 'DeviceProfiles', action: async () => { await prisma.deviceProfile.deleteMany(); }},
    { name: 'CommunicationTechFieldDefs', action: async () => { await prisma.communicationTechFieldDef.deleteMany(); }},
    { name: 'Tenants', action: async () => { await prisma.tenant.deleteMany(); }},
  ];

  for (const step of teardownSteps) {
    try {
      await step.action();
      console.log(`   ✓ Cleaned: ${step.name}`);
    } catch (error) {
      console.log(`   ⚠ Warning cleaning ${step.name}:`, (error as Error).message);
    }
  }

  console.log('\n   ✓ Teardown complete!\n');
}

// =============================================================================
// PART B: DATA CREATION
// =============================================================================

// -----------------------------------------------------------------------------
// B.1: Create Tenants (ltree)
// -----------------------------------------------------------------------------
async function createTenants() {
  console.log('🏢 Creating Tenants...');

  const tenants = [
    {
      path: 'root',
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
      },
    },
    {
      path: 'root.aski',
      name: 'ASKİ - Ankara Su ve Kanalizasyon İdaresi',
      contactFirstName: 'ASKİ',
      contactLastName: 'Yetkili',
      contactEmail: 'aski.yetkili@example.com',
      contactPhone: '+908887776655',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionPlan: 'enterprise',
      latitude: ASKI_BASE_LAT,
      longitude: ASKI_BASE_LNG,
      address: {
        city: 'Ankara',
        district: 'Çankaya',
        neighborhood: 'Kızılay',
        street: 'ASKİ Caddesi',
        buildingNo: '1',
      },
    },
    {
      path: 'root.hatsu',
      name: 'HATSU - Hatay Su ve Kanalizasyon İdaresi',
      contactFirstName: 'HATSU',
      contactLastName: 'Yetkili',
      contactEmail: 'hatsu.yetkili@example.com',
      contactPhone: '+907776665544',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionPlan: 'enterprise',
      latitude: HATSU_BASE_LAT,
      longitude: HATSU_BASE_LNG,
      address: {
        city: 'Hatay',
        district: 'Antakya',
        neighborhood: 'Merkez',
        street: 'HATSU Caddesi',
        buildingNo: '1',
      },
    },
  ];

  const createdTenants: Record<string, string> = {};

  for (const tenant of tenants) {
    const created = await prisma.tenant.create({
      data: {
        path: tenant.path,
        name: tenant.name,
        contactFirstName: tenant.contactFirstName,
        contactLastName: tenant.contactLastName,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        subscriptionStatus: tenant.subscriptionStatus,
        subscriptionPlan: tenant.subscriptionPlan,
        latitude: tenant.latitude,
        longitude: tenant.longitude,
        address: tenant.address,
      },
    });
    createdTenants[tenant.path] = created.id;
    console.log(`   ✓ ${tenant.name} (${tenant.path})`);
  }

  // Set parent relationships
  const rootId = createdTenants['root'];
  await prisma.tenant.update({ where: { id: createdTenants['root.aski'] }, data: { parentId: rootId } });
  await prisma.tenant.update({ where: { id: createdTenants['root.hatsu'] }, data: { parentId: rootId } });

  return createdTenants;
}

// -----------------------------------------------------------------------------
// B.2: Create Users
// -----------------------------------------------------------------------------
async function createUsers(tenants: Record<string, string>) {
  console.log('\n👤 Creating Users...');

  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const users = [
    {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'super.admin@example.com',
      phone: '+909998887766',
      tcIdNo: '12345678901',
      tenantPath: 'root',
      role: SystemRole.PLATFORM_ADMIN,
    },
    {
      firstName: 'ASKİ',
      lastName: 'Yetkili',
      email: 'aski.yetkili@example.com',
      phone: '+908887776655',
      tcIdNo: '12345678902',
      tenantPath: 'root.aski',
      role: SystemRole.TENANT_ADMIN,
    },
    {
      firstName: 'HATSU',
      lastName: 'Yetkili',
      email: 'hatsu.yetkili@example.com',
      phone: '+907776665544',
      tcIdNo: '12345678903',
      tenantPath: 'root.hatsu',
      role: SystemRole.TENANT_ADMIN,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        tcIdNo: userData.tcIdNo,
        passwordHash,
        isActive: true,
        language: 'tr',
        timezone: 'Europe/Istanbul',
      },
    });

    await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId: tenants[userData.tenantPath],
        role: userData.role,
      },
    });

    console.log(`   ✓ ${userData.email} (${userData.role} @ ${userData.tenantPath})`);
  }
}

// -----------------------------------------------------------------------------
// B.3: Create Communication Tech Field Definitions
// -----------------------------------------------------------------------------
async function createCommunicationTechDefs() {
  console.log('\n📡 Creating Communication Technology Field Definitions...');

  const techDefs = [
    {
      technology: CommunicationTechnology.LORAWAN,
      integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
      fields: [
        { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
      ],
    },
    {
      technology: CommunicationTechnology.SIGFOX,
      integrationTypes: [IntegrationType.HTTP, IntegrationType.API],
      fields: [
        { name: 'ID', type: 'hex', length: 8, regex: '^[a-fA-F0-9]{8}$', required: true },
        { name: 'PAC', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
      ],
    },
    {
      technology: CommunicationTechnology.NB_IOT,
      integrationTypes: [IntegrationType.MQTT, IntegrationType.HTTP, IntegrationType.API],
      fields: [
        { name: 'IMEI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: true },
        { name: 'IMSI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: false },
      ],
    },
  ];

  for (const def of techDefs) {
    await prisma.communicationTechFieldDef.create({ data: def });
    console.log(`   ✓ ${def.technology}`);
  }
}

// -----------------------------------------------------------------------------
// B.4: Create Meter Profiles (10 Total)
// Per Seed 2 spec:
// - 2 Manas → HATSU
// - 2 Itron → HATSU + ASKİ
// - 2 Baylan → HATSU + ASKİ
// - 2 Zenner → HATSU
// - 1 Cem → HATSU
// - 1 Klepsan → HATSU
// Note: ASKİ needs access to all profiles used in ASKİ batches
// -----------------------------------------------------------------------------
async function createMeterProfiles(tenants: Record<string, string>) {
  console.log('\n📊 Creating Meter Profiles (10 Total)...');

  const hatsuId = tenants['root.hatsu'];
  const askiId = tenants['root.aski'];

  const meterProfilesData = [
    // [0] Manas_A (View: HATSU + ASKİ - needed for ASKİ batch)
    {
      brand: Brand.MANAS,
      modelCode: 'MNS-A-DN15',
      meterType: MeterType.MULTI_JET,
      dialType: DialType.DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.HORIZONTAL,
      temperatureType: TemperatureType.T30,
      diameter: 15,
      q3: 2.5,
      ipRating: IPRating.IP68,
      communicationModule: CommunicationModule.RETROFIT,
      allowedTenants: [hatsuId, askiId],
    },
    // [1] Manas_B (View: HATSU + ASKİ - needed for ASKİ batch)
    {
      brand: Brand.MANAS,
      modelCode: 'MNS-B-DN20',
      meterType: MeterType.ULTRASONIC,
      dialType: DialType.DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.BOTH,
      temperatureType: TemperatureType.T30,
      diameter: 20,
      q3: 4.0,
      ipRating: IPRating.IP68,
      communicationModule: CommunicationModule.INTEGRATED,
      allowedTenants: [hatsuId, askiId],
    },
    // [2] Itron_A (View: HATSU + ASKİ)
    {
      brand: Brand.ITRON,
      modelCode: 'ITR-A-DN15',
      meterType: MeterType.SINGLE_JET,
      dialType: DialType.SUPER_DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.HORIZONTAL,
      temperatureType: TemperatureType.T30,
      diameter: 15,
      q3: 2.5,
      ipRating: IPRating.IP68,
      communicationModule: CommunicationModule.RETROFIT,
      allowedTenants: [hatsuId, askiId],
    },
    // [3] Itron_B (View: HATSU + ASKİ)
    {
      brand: Brand.ITRON,
      modelCode: 'ITR-B-DN20',
      meterType: MeterType.MULTI_JET,
      dialType: DialType.DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.BOTH,
      temperatureType: TemperatureType.T30,
      diameter: 20,
      q3: 4.0,
      ipRating: IPRating.IP68,
      communicationModule: CommunicationModule.RETROFIT,
      allowedTenants: [hatsuId, askiId],
    },
    // [4] Baylan_A (View: HATSU + ASKİ)
    {
      brand: Brand.BAYLAN,
      modelCode: 'BYL-A-DN15',
      meterType: MeterType.MULTI_JET,
      dialType: DialType.DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.HORIZONTAL,
      temperatureType: TemperatureType.T30,
      diameter: 15,
      q3: 2.5,
      ipRating: IPRating.IP68,
      communicationModule: CommunicationModule.RETROFIT,
      allowedTenants: [hatsuId, askiId],
    },
    // [5] Baylan_B (View: HATSU + ASKİ)
    {
      brand: Brand.BAYLAN,
      modelCode: 'BYL-B-DN20',
      meterType: MeterType.MULTI_JET,
      dialType: DialType.SUPER_DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.BOTH,
      temperatureType: TemperatureType.T30,
      diameter: 20,
      q3: 4.0,
      ipRating: IPRating.IP68,
      communicationModule: CommunicationModule.RETROFIT,
      allowedTenants: [hatsuId, askiId],
    },
    // [6] Zenner_A (View: HATSU + ASKİ - needed for ASKİ batch)
    {
      brand: Brand.ZENNER,
      modelCode: 'ZEN-A-DN15',
      meterType: MeterType.MULTI_JET,
      dialType: DialType.SUPER_DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.HORIZONTAL,
      temperatureType: TemperatureType.T30,
      diameter: 15,
      q3: 2.5,
      ipRating: IPRating.IP68,
      communicationModule: CommunicationModule.INTEGRATED,
      allowedTenants: [hatsuId, askiId],
    },
    // [7] Zenner_B (View: HATSU + ASKİ - needed for ASKİ batch)
    {
      brand: Brand.ZENNER,
      modelCode: 'ZEN-B-DN20',
      meterType: MeterType.ULTRASONIC,
      dialType: DialType.DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.BOTH,
      temperatureType: TemperatureType.T30,
      diameter: 20,
      q3: 4.0,
      ipRating: IPRating.IP68,
      communicationModule: CommunicationModule.INTEGRATED,
      allowedTenants: [hatsuId, askiId],
    },
    // [8] Cem_A (View: HATSU + ASKİ - needed for ASKİ batch)
    {
      brand: Brand.CEM,
      modelCode: 'CEM-A-DN15',
      meterType: MeterType.SINGLE_JET,
      dialType: DialType.DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.HORIZONTAL,
      temperatureType: TemperatureType.T30,
      diameter: 15,
      q3: 2.5,
      ipRating: IPRating.IP67,
      communicationModule: CommunicationModule.RETROFIT,
      allowedTenants: [hatsuId, askiId],
    },
    // [9] Klepsan_A (View: HATSU)
    {
      brand: Brand.KLEPSAN,
      modelCode: 'KLP-A-DN15',
      meterType: MeterType.MULTI_JET,
      dialType: DialType.DRY,
      connectionType: ConnectionType.THREAD,
      mountingType: MountingType.HORIZONTAL,
      temperatureType: TemperatureType.T30,
      diameter: 15,
      q3: 2.5,
      ipRating: IPRating.IP67,
      communicationModule: CommunicationModule.RETROFIT,
      allowedTenants: [hatsuId],
    },
  ];

  const meterProfiles: string[] = [];

  for (let i = 0; i < meterProfilesData.length; i++) {
    const { allowedTenants, ...profileData } = meterProfilesData[i];
    const created = await prisma.meterProfile.create({
      data: {
        ...profileData,
        allowedTenants: { connect: allowedTenants.map(id => ({ id })) },
      },
    });
    meterProfiles.push(created.id);
    console.log(`   ✓ [${i}] ${profileData.brand} ${profileData.modelCode}`);
  }

  return meterProfiles;
}

// -----------------------------------------------------------------------------
// B.5: Create Device Profiles (7 Total)
// Per Seed 2 spec:
// - 1 Manas | Manas + Itron compat | HATSU + ASKİ
// - 1 Itron | Manas + Itron compat | HATSU + ASKİ
// - 1 Baylan | Baylan compat | HATSU + ASKİ
// - 1 Cem | Cem compat | HATSU
// - 1 Klepsan | Klepsan compat | HATSU
// - 1 Ima | All compat | HATSU + ASKİ
// - 1 Codigno | Manas + Itron compat | HATSU + ASKİ
// -----------------------------------------------------------------------------
async function createDeviceProfiles(meterProfiles: string[]) {
  console.log('\n📱 Creating Device Profiles (7 Total)...');

  const deviceProfilesData = [
    // [0] Manas_Dev - Compatible with Manas + Itron profiles
    {
      brand: DeviceBrand.MANAS,
      modelCode: 'MNS-DEV-LW01',
      communicationTechnology: CommunicationTechnology.LORAWAN,
      integrationType: IntegrationType.MQTT,
      fieldDefinitions: [
        { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
      ],
      decoderFunction: 'function decode(payload) { return { value: parseInt(payload, 16) / 1000 }; }',
      batteryLifeMonths: 120,
      compatibleMeterProfiles: [meterProfiles[0], meterProfiles[1], meterProfiles[2], meterProfiles[3]],
    },
    // [1] Itron_Dev - Compatible with Manas + Itron profiles
    {
      brand: DeviceBrand.ITRON,
      modelCode: 'ITR-DEV-NB01',
      communicationTechnology: CommunicationTechnology.NB_IOT,
      integrationType: IntegrationType.HTTP,
      fieldDefinitions: [
        { name: 'IMEI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: true },
        { name: 'IMSI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: false },
      ],
      decoderFunction: 'function decode(payload) { const d = JSON.parse(payload); return { value: d.reading / 1000 }; }',
      batteryLifeMonths: 84,
      compatibleMeterProfiles: [meterProfiles[0], meterProfiles[1], meterProfiles[2], meterProfiles[3]],
    },
    // [2] Baylan_Dev - Compatible with Baylan profiles
    {
      brand: DeviceBrand.BAYLAN,
      modelCode: 'BYL-DEV-LW01',
      communicationTechnology: CommunicationTechnology.LORAWAN,
      integrationType: IntegrationType.MQTT,
      fieldDefinitions: [
        { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
      ],
      decoderFunction: 'function decode(payload) { return { value: parseInt(payload.slice(0,8), 16) / 1000 }; }',
      batteryLifeMonths: 96,
      compatibleMeterProfiles: [meterProfiles[4], meterProfiles[5]],
    },
    // [3] Cem_Dev - Compatible with Cem profiles
    {
      brand: DeviceBrand.CEM,
      modelCode: 'CEM-DEV-SF01',
      communicationTechnology: CommunicationTechnology.SIGFOX,
      integrationType: IntegrationType.HTTP,
      fieldDefinitions: [
        { name: 'ID', type: 'hex', length: 8, regex: '^[a-fA-F0-9]{8}$', required: true },
        { name: 'PAC', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
      ],
      decoderFunction: 'function decode(payload) { return { value: parseInt(payload, 16) / 1000 }; }',
      batteryLifeMonths: 60,
      compatibleMeterProfiles: [meterProfiles[8]],
    },
    // [4] Klepsan_Dev - Compatible with Klepsan profiles
    {
      brand: DeviceBrand.KLEPSAN,
      modelCode: 'KLP-DEV-LW01',
      communicationTechnology: CommunicationTechnology.LORAWAN,
      integrationType: IntegrationType.MQTT,
      fieldDefinitions: [
        { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
      ],
      decoderFunction: 'function decode(payload) { return { value: parseInt(payload, 16) / 1000 }; }',
      batteryLifeMonths: 72,
      compatibleMeterProfiles: [meterProfiles[9]],
    },
    // [5] Ima_Dev - Universal compatibility (Manas + Itron + Baylan + Zenner + Cem + Klepsan)
    {
      brand: DeviceBrand.IMA,
      modelCode: 'IMA-DEV-LW01',
      communicationTechnology: CommunicationTechnology.LORAWAN,
      integrationType: IntegrationType.MQTT,
      fieldDefinitions: [
        { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
      ],
      decoderFunction: 'function decode(payload) { return { value: parseInt(payload, 16) / 1000 }; }',
      batteryLifeMonths: 120,
      compatibleMeterProfiles: meterProfiles, // All profiles
    },
    // [6] Codigno_Dev - Compatible with Manas + Itron
    {
      brand: DeviceBrand.CODIGNO,
      modelCode: 'CDG-DEV-NB01',
      communicationTechnology: CommunicationTechnology.NB_IOT,
      integrationType: IntegrationType.HTTP,
      fieldDefinitions: [
        { name: 'IMEI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: true },
      ],
      decoderFunction: 'function decode(payload) { const d = JSON.parse(payload); return { value: d.val / 1000 }; }',
      batteryLifeMonths: 96,
      compatibleMeterProfiles: [meterProfiles[0], meterProfiles[1], meterProfiles[2], meterProfiles[3]],
    },
  ];

  const deviceProfiles: string[] = [];

  for (let i = 0; i < deviceProfilesData.length; i++) {
    const { compatibleMeterProfiles, ...profileData } = deviceProfilesData[i];
    const created = await prisma.deviceProfile.create({
      data: {
        ...profileData,
        compatibleMeterProfiles: { connect: compatibleMeterProfiles.map(id => ({ id })) },
      },
    });
    deviceProfiles.push(created.id);
    console.log(`   ✓ [${i}] ${profileData.brand} ${profileData.modelCode}`);
  }

  return deviceProfiles;
}

// -----------------------------------------------------------------------------
// B.6: Create Bulk Assets (Devices + Customers + Meters)
// SEED 2: All batches are 100 units
// -----------------------------------------------------------------------------
interface AssetBatch {
  count: number;
  meterProfileIdx: number;
  deviceProfileIdx: number;
  tenantPath: string;
  serialPrefix: string;
}

async function createBulkAssets(
  tenants: Record<string, string>,
  meterProfiles: string[],
  deviceProfiles: string[]
) {
  console.log('\n📦 Creating Bulk Assets (Seed 2 - 100 per batch)...\n');

  // Define all batches per Seed 2 specification
  const batches: AssetBatch[] = [
    // HATSU Tenant (4 batches × 100 = 400 units)
    { count: 100, meterProfileIdx: 2, deviceProfileIdx: 1, tenantPath: 'root.hatsu', serialPrefix: 'HATSU-A' },   // Itron[0] + Itron
    { count: 100, meterProfileIdx: 4, deviceProfileIdx: 2, tenantPath: 'root.hatsu', serialPrefix: 'HATSU-B' },   // Baylan[0] + Baylan
    { count: 100, meterProfileIdx: 6, deviceProfileIdx: 5, tenantPath: 'root.hatsu', serialPrefix: 'HATSU-C' },   // Zenner[0] + Ima
    { count: 100, meterProfileIdx: 9, deviceProfileIdx: 4, tenantPath: 'root.hatsu', serialPrefix: 'HATSU-D' },   // Klepsan + Klepsan
    
    // ASKİ Tenant (13 batches × 100 = 1,300 units)
    { count: 100, meterProfileIdx: 0, deviceProfileIdx: 1, tenantPath: 'root.aski', serialPrefix: 'ASKI-A1' },    // Manas[0] + Itron
    { count: 100, meterProfileIdx: 0, deviceProfileIdx: 5, tenantPath: 'root.aski', serialPrefix: 'ASKI-A2' },    // Manas[0] + Ima
    { count: 100, meterProfileIdx: 1, deviceProfileIdx: 1, tenantPath: 'root.aski', serialPrefix: 'ASKI-B1' },    // Manas[1] + Itron
    { count: 100, meterProfileIdx: 1, deviceProfileIdx: 5, tenantPath: 'root.aski', serialPrefix: 'ASKI-B2' },    // Manas[1] + Ima
    { count: 100, meterProfileIdx: 2, deviceProfileIdx: 1, tenantPath: 'root.aski', serialPrefix: 'ASKI-C1' },    // Itron[0] + Itron
    { count: 100, meterProfileIdx: 2, deviceProfileIdx: 5, tenantPath: 'root.aski', serialPrefix: 'ASKI-C2' },    // Itron[0] + Ima
    { count: 100, meterProfileIdx: 3, deviceProfileIdx: 1, tenantPath: 'root.aski', serialPrefix: 'ASKI-D1' },    // Itron[1] + Itron
    { count: 100, meterProfileIdx: 3, deviceProfileIdx: 5, tenantPath: 'root.aski', serialPrefix: 'ASKI-D2' },    // Itron[1] + Ima
    { count: 100, meterProfileIdx: 4, deviceProfileIdx: 2, tenantPath: 'root.aski', serialPrefix: 'ASKI-E1' },    // Baylan[0] + Baylan
    { count: 100, meterProfileIdx: 5, deviceProfileIdx: 2, tenantPath: 'root.aski', serialPrefix: 'ASKI-F1' },    // Baylan[1] + Baylan
    { count: 100, meterProfileIdx: 6, deviceProfileIdx: 5, tenantPath: 'root.aski', serialPrefix: 'ASKI-G1' },    // Zenner[0] + Ima
    { count: 100, meterProfileIdx: 7, deviceProfileIdx: 5, tenantPath: 'root.aski', serialPrefix: 'ASKI-H1' },    // Zenner[1] + Ima
    { count: 100, meterProfileIdx: 8, deviceProfileIdx: 3, tenantPath: 'root.aski', serialPrefix: 'ASKI-I1' },    // Cem[0] + Cem
  ];

  let globalDeviceCounter = 0;
  let globalMeterCounter = 0;
  let globalCustomerCounter = 0;

  for (const batch of batches) {
    const tenantId = tenants[batch.tenantPath];
    const meterProfileId = meterProfiles[batch.meterProfileIdx];
    const deviceProfileId = deviceProfiles[batch.deviceProfileIdx];
    const isHatsu = batch.tenantPath === 'root.hatsu';
    const baseLat = isHatsu ? HATSU_BASE_LAT : ASKI_BASE_LAT;
    const baseLng = isHatsu ? HATSU_BASE_LNG : ASKI_BASE_LNG;

    console.log(`\n   📍 ${batch.serialPrefix}: ${batch.count} units (MeterProfile[${batch.meterProfileIdx}] + DeviceProfile[${batch.deviceProfileIdx}])`);

    // Generate all data for this batch
    const items: Array<{
      deviceSerial: string;
      meterSerial: string;
      customerName: string;
      coords: { lat: number; lng: number };
      dynamicFields: Record<string, string>;
    }> = [];

    for (let i = 0; i < batch.count; i++) {
      globalDeviceCounter++;
      globalMeterCounter++;
      globalCustomerCounter++;

      items.push({
        deviceSerial: generateSerial(`DEV-${batch.serialPrefix}`, globalDeviceCounter),
        meterSerial: generateSerial(`MTR-${batch.serialPrefix}`, globalMeterCounter),
        customerName: `Customer ${batch.serialPrefix}-${globalCustomerCounter}`,
        coords: randomCoordinate(baseLat, baseLng, 15),
        dynamicFields: {
          DevEUI: randomHex(16),
          JoinEUI: randomHex(16),
          AppKey: randomHex(32),
        },
      });
    }

    // Process in batches
    await processBatch(
      items,
      BATCH_SIZE,
      async (batchItems) => {
        await prisma.$transaction(async (tx) => {
          // Create devices
          await tx.device.createMany({
            data: batchItems.map(item => ({
              serialNumber: item.deviceSerial,
              tenantId,
              deviceProfileId,
              status: DeviceStatus.ACTIVE,
              dynamicFields: item.dynamicFields,
            })),
          });

          // Get created devices
          const devices = await tx.device.findMany({
            where: { serialNumber: { in: batchItems.map(i => i.deviceSerial) } },
            select: { id: true, serialNumber: true },
          });
          const deviceMap = new Map(devices.map(d => [d.serialNumber, d.id]));

          // Create customers
          await tx.customer.createMany({
            data: batchItems.map(item => ({
              tenantId,
              customerType: CustomerType.INDIVIDUAL,
              consumptionType: ConsumptionType.NORMAL,
              details: { firstName: item.customerName, lastName: 'Auto', tcIdNo: randomHex(11) },
              address: { city: isHatsu ? 'Hatay' : 'Ankara', district: 'Merkez' },
              latitude: item.coords.lat,
              longitude: item.coords.lng,
            })),
          });

          // Get created customers (match by name pattern)
          const customers = await tx.customer.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: batchItems.length,
            select: { id: true },
          });

          // Create meters
          const metersData = batchItems.map((item, idx) => ({
            serialNumber: item.meterSerial,
            tenantId,
            customerId: customers[idx]?.id || customers[0].id,
            meterProfileId,
            activeDeviceId: deviceMap.get(item.deviceSerial),
            initialIndex: Math.random() * 1000,
            installationDate: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000), // Within last 45 days
            status: MeterStatus.ACTIVE,
            address: { city: isHatsu ? 'Hatay' : 'Ankara', district: 'Merkez' },
            latitude: item.coords.lat,
            longitude: item.coords.lng,
          }));

          await tx.meter.createMany({ data: metersData });
        }, { timeout: 60000 });
      },
      batch.serialPrefix
    );
  }

  console.log(`\n   ✓ Total Devices: ${globalDeviceCounter}`);
  console.log(`   ✓ Total Meters: ${globalMeterCounter}`);
  console.log(`   ✓ Total Customers: ${globalCustomerCounter}`);
}

// -----------------------------------------------------------------------------
// B.7: Create Golden Record (Kemalettin ŞAHİN)
// With exact coordinates from Seed 2
// -----------------------------------------------------------------------------
async function createGoldenRecord(
  tenants: Record<string, string>,
  meterProfiles: string[],
  deviceProfiles: string[]
) {
  console.log('\n⭐ Creating Golden Record (Kemalettin ŞAHİN)...');

  const askiId = tenants['root.aski'];

  // Exact coordinates from Seed 2
  const meter1Coords = { lat: 39.99451679511336, lng: 32.86308219026244 };
  const meter2Coords = { lat: 39.89441311052211, lng: 32.81460781844764 };

  // Create the special customer
  const customer = await prisma.customer.create({
    data: {
      tenantId: askiId,
      customerType: CustomerType.INDIVIDUAL,
      consumptionType: ConsumptionType.NORMAL,
      details: {
        firstName: 'Kemalettin',
        lastName: 'ŞAHİN',
        tcIdNo: '12345678901',
        phone: '+905551234567',
        email: 'kemalettin.sahin@example.com',
      },
      address: {
        city: 'Ankara',
        district: 'Keçiören',
        neighborhood: 'Tepebaşı Mahallesi',
        street: 'Foça Sokak',
        buildingNo: '100',
        floor: '2',
        postalCode: '06390',
      },
      latitude: meter1Coords.lat,
      longitude: meter1Coords.lng,
    },
  });

  console.log(`   ✓ Customer: Kemalettin ŞAHİN (${customer.id})`);

  // Create dedicated devices for golden record meters
  const goldenDevices = await Promise.all([
    prisma.device.create({
      data: {
        serialNumber: 'GOLDEN-DEV-001',
        tenantId: askiId,
        deviceProfileId: deviceProfiles[1], // Itron device
        status: DeviceStatus.ACTIVE,
        dynamicFields: { IMEI: '999999999990001', IMSI: '999999999990001' },
      },
    }),
    prisma.device.create({
      data: {
        serialNumber: 'GOLDEN-DEV-002',
        tenantId: askiId,
        deviceProfileId: deviceProfiles[1], // Itron device
        status: DeviceStatus.ACTIVE,
        dynamicFields: { IMEI: '999999999990002', IMSI: '999999999990002' },
      },
    }),
  ]);

  console.log(`   ✓ Created 2 dedicated devices for golden record`);

  // Meter addresses per Seed 2
  const meterAddresses = [
    {
      address: {
        city: 'Ankara',
        district: 'Keçiören',
        neighborhood: 'Tepebaşı Mahallesi',
        street: 'Foça Sokak',
        buildingNo: '100',
        floor: '2',
        postalCode: '06390',
      },
      lat: meter1Coords.lat,
      lng: meter1Coords.lng,
    },
    {
      address: {
        city: 'Ankara',
        district: 'Çankaya',
        neighborhood: 'Ehlibeyt Mahallesi',
        street: 'Tekstilciler Caddesi',
        buildingNo: '16',
        floor: '4',
        postalCode: '06520',
      },
      lat: meter2Coords.lat,
      lng: meter2Coords.lng,
    },
  ];

  for (let i = 0; i < 2; i++) {
    const meter = await prisma.meter.create({
      data: {
        serialNumber: `GOLDEN-MTR-${i + 1}`,
        tenantId: askiId,
        customerId: customer.id,
        meterProfileId: meterProfiles[2], // Itron_A
        activeDeviceId: goldenDevices[i].id,
        initialIndex: 0,
        installationDate: new Date('2024-10-01'),
        status: MeterStatus.ACTIVE,
        address: meterAddresses[i].address,
        latitude: meterAddresses[i].lat,
        longitude: meterAddresses[i].lng,
      },
    });
    console.log(`   ✓ Meter ${i + 1}: ${meter.serialNumber} @ ${meterAddresses[i].address.neighborhood}`);
  }
}

// =============================================================================
// PART C: HISTORICAL READINGS (SQL Generation)
// SEED 2: 24 readings/day × 45 days with realistic values
// =============================================================================
async function generateHistoricalReadings() {
  console.log('\n📈 PART C: Generating Historical Readings (45 days, 24 readings/day)...');
  console.log('   ⏳ This may take a minute...\n');

  const startTime = Date.now();

  // Generate readings using pure SQL for maximum performance
  // 24 readings/day = 1 reading per hour
  // Includes: realistic consumption patterns, signal strength, battery, temperature
  await prisma.$executeRaw`
    INSERT INTO "readings" (
      "id", 
      "time", 
      "tenant_id", 
      "meter_id", 
      "value", 
      "consumption", 
      "unit", 
      "signal_strength", 
      "battery_level", 
      "temperature",
      "source",
      "source_device_id",
      "communication_technology",
      "processed_at"
    )
    SELECT
      gen_random_uuid() as id,
      time_series.ts as time,
      m.tenant_id as tenant_id,
      m.id as meter_id,
      
      -- CUMULATIVE VALUE: Initial Index + accumulated consumption
      -- Uses a window function approach via subquery for cumulative sum
      m.initial_index + (
        -- Calculate hours since start
        (EXTRACT(EPOCH FROM (time_series.ts - (NOW() - interval '45 days'))) / 3600)
        -- Base hourly rate with time-of-day variation
        * (
          CASE 
            -- Night hours (00:00 - 06:00): Very low usage
            WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 0 AND 5 THEN 0.005
            -- Early morning (06:00 - 08:00): Rising usage (showers, breakfast)
            WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 6 AND 7 THEN 0.08
            -- Morning peak (08:00 - 10:00): High usage
            WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 8 AND 9 THEN 0.12
            -- Mid-day (10:00 - 17:00): Moderate usage
            WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 10 AND 16 THEN 0.04
            -- Evening peak (17:00 - 21:00): High usage (cooking, cleaning, showers)
            WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 17 AND 20 THEN 0.10
            -- Late evening (21:00 - 23:59): Declining usage
            ELSE 0.02
          END
        )
        -- Weekend factor (slightly higher on weekends)
        * (CASE WHEN EXTRACT(DOW FROM time_series.ts) IN (0, 6) THEN 1.15 ELSE 1.0 END)
        -- Add some randomness (±20%)
        * (0.8 + random() * 0.4)
      ) as value,
      
      -- HOURLY CONSUMPTION: Water used in this hour
      (
        CASE 
          WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 0 AND 5 THEN 0.005
          WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 6 AND 7 THEN 0.08
          WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 8 AND 9 THEN 0.12
          WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 10 AND 16 THEN 0.04
          WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 17 AND 20 THEN 0.10
          ELSE 0.02
        END
      ) 
      * (CASE WHEN EXTRACT(DOW FROM time_series.ts) IN (0, 6) THEN 1.15 ELSE 1.0 END)
      * (0.8 + random() * 0.4) as consumption,
      
      'm3' as unit,
      
      -- SIGNAL STRENGTH: -60 to -110 dBm (varies with some randomness)
      -- Better signal during day, slightly worse at night
      (
        -70 
        - (random() * 30)::int  -- Random variation -70 to -100
        - (CASE WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 2 AND 5 THEN 5 ELSE 0 END)  -- Slightly worse at night
      )::int as signal_strength,
      
      -- BATTERY LEVEL: Starts at 100%, slowly decreases over 45 days
      -- Decreases roughly 0.5% per day, with small random variations
      GREATEST(
        85,
        100 - (
          (EXTRACT(EPOCH FROM (time_series.ts - (NOW() - interval '45 days'))) / 86400) * 0.3
        )::int - (random() * 2)::int
      )::int as battery_level,
      
      -- TEMPERATURE: Ambient temperature (10-25°C typical, varies by time of day)
      (
        15.0  -- Base temp
        + (CASE 
            WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 12 AND 16 THEN 8  -- Warmer midday
            WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 6 AND 11 THEN 4   -- Morning warmup
            WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 17 AND 20 THEN 5  -- Evening cooldown
            ELSE 0  -- Night (coolest)
          END)
        + (random() * 4 - 2)  -- Random variation ±2°C
      )::decimal(5,2) as temperature,
      
      'LORAWAN' as source,
      
      -- Link to the meter's active device
      m.active_device_id as source_device_id,
      
      -- Communication technology
      'LORAWAN'::"CommunicationTechnology" as communication_technology,
      
      -- Processed timestamp (slightly after reading time)
      time_series.ts + interval '1 second' * (random() * 5) as processed_at
      
    FROM "meters" m
    CROSS JOIN generate_series(
      NOW() - interval '45 days',
      NOW(),
      interval '1 hour'
    ) as time_series(ts)
    WHERE m.status = 'ACTIVE'
  `;

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Get count
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM readings`;
  const readingsCount = Number(countResult[0].count);

  console.log(`   ✓ Generated ${readingsCount.toLocaleString()} readings in ${duration}s`);

  // Update meters with their last reading values
  console.log('   📊 Updating meters with last reading values...');
  
  await prisma.$executeRaw`
    UPDATE "meters" m
    SET 
      last_reading_value = r.value,
      last_reading_time = r.time
    FROM (
      SELECT DISTINCT ON (meter_id) 
        meter_id, 
        value, 
        time
      FROM "readings"
      ORDER BY meter_id, time DESC
    ) r
    WHERE m.id = r.meter_id
  `;

  console.log('   ✓ Updated meter last reading values');

  // Update devices with their last communication data from readings
  // Every reading = device communication, so devices should reflect the last reading's metrics
  console.log('   📡 Updating devices with last communication data...');
  
  await prisma.$executeRaw`
    UPDATE "devices" d
    SET 
      last_signal_strength = r.signal_strength,
      last_battery_level = r.battery_level,
      last_communication_at = r.time
    FROM (
      SELECT DISTINCT ON (source_device_id) 
        source_device_id,
        signal_strength,
        battery_level,
        time
      FROM "readings"
      WHERE source_device_id IS NOT NULL
      ORDER BY source_device_id, time DESC
    ) r
    WHERE d.id = r.source_device_id
  `;

  console.log('   ✓ Updated device communication data');
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================
async function main() {
  console.log('='.repeat(80));
  console.log('🌱 READ WATER - SEED 2 (Development/Demo Environment)');
  console.log('='.repeat(80));

  const startTime = Date.now();

  // PART A: Teardown
  await teardown();

  // PART B: Data Creation
  console.log('📊 PART B: DATA CREATION\n');

  // B.1: Tenants
  const tenants = await createTenants();

  // B.2: Users
  await createUsers(tenants);

  // B.3: Communication Tech Definitions
  await createCommunicationTechDefs();

  // B.4: Meter Profiles
  const meterProfiles = await createMeterProfiles(tenants);

  // B.5: Device Profiles
  const deviceProfiles = await createDeviceProfiles(meterProfiles);

  // B.6: Bulk Assets
  await createBulkAssets(tenants, meterProfiles, deviceProfiles);

  // B.7: Golden Record
  await createGoldenRecord(tenants, meterProfiles, deviceProfiles);

  // PART C: Historical Readings
  await generateHistoricalReadings();

  // Summary
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(80));
  console.log('🎉 SEED 2 COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(80));
  console.log(`\n⏱️  Total Duration: ${totalDuration}s\n`);
  console.log('📊 Summary:');
  console.log('   • Tenants: 3 (Root, ASKİ, HATSU)');
  console.log('   • Users: 3 (super.admin, aski.yetkili, hatsu.yetkili)');
  console.log('   • Password: Asdf1234.');
  console.log('   • Meter Profiles: 10');
  console.log('   • Device Profiles: 7');
  console.log('   • HATSU Assets: 400 meters (4 batches × 100)');
  console.log('   • ASKİ Assets: 1,300 meters (13 batches × 100)');
  console.log('   • Golden Record: Kemalettin ŞAHİN (2 meters)');
  console.log('   • Total Meters: 1,702');
  console.log('   • Readings: ~1.8M (45 days × 24/day × 1,702 meters)');
  console.log('');
  console.log('📈 Reading Fields Populated:');
  console.log('   • value: Cumulative meter index (m³)');
  console.log('   • consumption: Hourly consumption with day/night patterns');
  console.log('   • signal_strength: -60 to -110 dBm');
  console.log('   • battery_level: 85-100% (slowly decreasing)');
  console.log('   • temperature: 10-25°C (time-of-day variation)');
  console.log('   • source_device_id: Linked to active device');
  console.log('');
  console.log('🔄 Data Consistency:');
  console.log('   • Meters updated with last_reading_value/time');
  console.log('   • Devices updated with last_signal_strength/battery/communication_at');
  console.log('\n' + '='.repeat(80) + '\n');
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
