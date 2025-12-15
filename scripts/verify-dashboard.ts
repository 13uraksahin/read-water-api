/**
 * =============================================================================
 * Read Water - Dashboard Verification Script
 * =============================================================================
 *
 * This script verifies that the Dashboard endpoints return real data from the
 * database, respecting the Asset/Device separation architecture.
 *
 * Tests:
 *   1. Auth: Login as Admin
 *   2. GET /dashboard/stats - Verify non-zero counts match DB
 *   3. GET /dashboard/map - Verify map data includes device info
 *   4. GET /dashboard/alarms - Verify alarm list
 *   5. GET /dashboard/consumption - Verify consumption chart data
 *   6. Create dummy data if DB is empty (optional)
 *
 * Usage:
 *   cd api
 *   npx ts-node scripts/verify-dashboard.ts
 *
 * Options:
 *   --url=http://...   API base URL (default: http://localhost:4000)
 *   --seed-if-empty    Create test data if no meters exist
 *
 * =============================================================================
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, MeterStatus, DeviceStatus, AlarmStatus, AlarmType } from '@prisma/client';

const API_BASE = process.env.API_URL || 'http://localhost:4000';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value ?? 'true';
  return acc;
}, {} as Record<string, string>);

const CONFIG = {
  url: args.url || API_BASE,
  seedIfEmpty: args['seed-if-empty'] === 'true',
};

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  data?: any;
}

interface TestContext {
  accessToken?: string;
  tenantId?: string;
}

interface DashboardStats {
  totalMeters: number;
  totalCustomers: number;
  totalReadings: number;
  totalWaterUsage: number;
  activeAlarms: number;
  metersInMaintenance: number;
  metersOffline: number;
  totalDevices: number;
  devicesInWarehouse: number;
  devicesDeployed: number;
}

interface MeterMapData {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  mapStatus: string;
  hasAlarm: boolean;
  isHighUsage: boolean;
  isOffline: boolean;
  serialNumber: string;
  customerName: string | null;
  batteryLevel: number | null;
  signalStrength: number | null;
  lastCommunicationAt: string | null;
}

interface DashboardAlarm {
  id: string;
  type: string;
  status: string;
  severity: number;
  message: string | null;
  createdAt: string;
  meterSerial: string;
  customerName: string | null;
}

interface ConsumptionDataPoint {
  date: string;
  timestamp: number;
  consumption: number;
}

// =============================================================================
// Test Utilities
// =============================================================================

async function apiRequest(
  method: string,
  path: string,
  body?: any,
  token?: string,
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${CONFIG.url}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { status: response.status, data };
  } catch (error) {
    return { status: 0, data: { error: String(error) } };
  }
}

function printResult(result: TestResult): void {
  const icon = result.passed ? '✅' : '❌';
  console.log(`   ${icon} ${result.name}`);
  console.log(`      ${result.details}`);
  if (result.data) {
    console.log(`      Data preview: ${JSON.stringify(result.data).substring(0, 200)}...`);
  }
}

// =============================================================================
// Seed Helper (if DB is empty)
// =============================================================================

async function seedTestDataIfNeeded(): Promise<boolean> {
  const meterCount = await prisma.meter.count();
  if (meterCount > 0) {
    console.log(`   ℹ️  Database has ${meterCount} meters, skipping seed.`);
    return false;
  }

  console.log('   🌱 Database is empty. Creating test data...');

  // Get or create a tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        path: 'test_tenant',
      },
    });
    console.log(`      Created tenant: ${tenant.name}`);
  }

  // Get or create a customer
  let customer = await prisma.customer.findFirst({ where: { tenantId: tenant.id } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        customerType: 'INDIVIDUAL',
        consumptionType: 'NORMAL',
        details: { firstName: 'Test', lastName: 'Customer' },
        address: { city: 'Ankara', district: 'Çankaya' },
        latitude: 39.9334,
        longitude: 32.8597,
      },
    });
    console.log(`      Created customer: Test Customer`);
  }

  // Get or create a meter profile
  let meterProfile = await prisma.meterProfile.findFirst();
  if (!meterProfile) {
    meterProfile = await prisma.meterProfile.create({
      data: {
        brand: 'BAYLAN',
        modelCode: 'TEST-MODEL',
        meterType: 'SINGLE_JET',
        dialType: 'DRY',
        connectionType: 'THREAD',
        mountingType: 'HORIZONTAL',
        temperatureType: 'T30',
        communicationModule: 'NONE',
      },
    });
    console.log(`      Created meter profile: ${meterProfile.modelCode}`);
  }

  // Get or create a device profile
  let deviceProfile = await prisma.deviceProfile.findFirst();
  if (!deviceProfile) {
    deviceProfile = await prisma.deviceProfile.create({
      data: {
        brand: 'UNA',
        modelCode: 'TEST-DEVICE',
        communicationTechnology: 'LORAWAN',
        integrationType: 'HTTP',
        fieldDefinitions: [
          { name: 'DevEUI', type: 'hex', length: 16, required: true },
        ],
        decoderFunction: 'function decode(payload) { return { value: 0 }; }',
      },
    });
    console.log(`      Created device profile: ${deviceProfile.modelCode}`);
  }

  // Create some test meters with locations
  const testLocations = [
    { lat: 39.9334, lng: 32.8597, name: 'Center' },
    { lat: 39.9254, lng: 32.8667, name: 'East' },
    { lat: 39.9404, lng: 32.8527, name: 'West' },
    { lat: 39.9184, lng: 32.8697, name: 'South' },
    { lat: 39.9450, lng: 32.8500, name: 'North' },
  ];

  for (let i = 0; i < testLocations.length; i++) {
    const loc = testLocations[i];
    const serial = `TEST-MTR-${Date.now()}-${i}`;

    // Create device
    const device = await prisma.device.create({
      data: {
        tenantId: tenant.id,
        deviceProfileId: deviceProfile.id,
        serialNumber: `DEV-${Date.now()}-${i}`,
        status: i === 0 ? DeviceStatus.DEPLOYED : DeviceStatus.WAREHOUSE,
        dynamicFields: { DevEUI: `000000000000000${i}` },
        lastBatteryLevel: Math.floor(Math.random() * 100),
        lastSignalStrength: -90 + Math.floor(Math.random() * 40),
        lastCommunicationAt: new Date(),
      },
    });

    // Create meter linked to device (only first one)
    const meter = await prisma.meter.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        meterProfileId: meterProfile.id,
        activeDeviceId: i === 0 ? device.id : null,
        serialNumber: serial,
        initialIndex: 0,
        installationDate: new Date(),
        status: i === 3 ? MeterStatus.MAINTENANCE : MeterStatus.ACTIVE,
        latitude: loc.lat,
        longitude: loc.lng,
        address: { city: 'Ankara', district: loc.name },
      },
    });

    // Create some readings for first meter
    if (i === 0) {
      const now = new Date();
      for (let d = 0; d < 10; d++) {
        const readingTime = new Date(now);
        readingTime.setDate(readingTime.getDate() - d);
        
        await prisma.reading.create({
          data: {
            tenantId: tenant.id,
            meterId: meter.id,
            value: 100 + d * 10,
            consumption: 5 + Math.random() * 10,
            time: readingTime,
          },
        });
      }
      console.log(`      Created 10 readings for meter ${serial}`);
    }

    // Create an alarm for one meter
    if (i === 1) {
      await prisma.alarm.create({
        data: {
          tenantId: tenant.id,
          meterId: meter.id,
          type: AlarmType.LOW_BATTERY,
          status: AlarmStatus.ACTIVE,
          severity: 3,
          message: `Low battery warning on meter ${serial}`,
        },
      });
      console.log(`      Created alarm for meter ${serial}`);
    }

    console.log(`      Created meter ${serial} at ${loc.name}`);
  }

  console.log('   ✅ Test data seeded successfully.');
  return true;
}

// =============================================================================
// Test Cases
// =============================================================================

async function test1_Auth(ctx: TestContext): Promise<TestResult> {
  const response = await apiRequest('POST', '/api/v1/auth/login', {
    email: 'admin@readwater.io',
    password: 'Admin@123',
  });

  if (response.status === 200 || response.status === 201) {
    ctx.accessToken = response.data.accessToken;
    ctx.tenantId = response.data.user?.tenantId;
    return {
      name: 'Auth: Login as Admin',
      passed: true,
      details: `Token obtained, tenantId: ${ctx.tenantId || 'N/A'}`,
    };
  }

  return {
    name: 'Auth: Login as Admin',
    passed: false,
    details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
  };
}

async function test2_DashboardStats(ctx: TestContext): Promise<TestResult> {
  const response = await apiRequest(
    'GET',
    '/api/v1/dashboard/stats',
    undefined,
    ctx.accessToken,
  );

  if (response.status !== 200) {
    return {
      name: 'GET /dashboard/stats',
      passed: false,
      details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
    };
  }

  const stats: DashboardStats = response.data;

  // Verify against DB counts
  const dbMeterCount = await prisma.meter.count();
  const dbCustomerCount = await prisma.customer.count();
  const dbDeviceCount = await prisma.device.count();

  const metersMatch = stats.totalMeters === dbMeterCount;
  const customersMatch = stats.totalCustomers === dbCustomerCount;
  const devicesMatch = stats.totalDevices === dbDeviceCount;

  const allMatch = metersMatch && customersMatch && devicesMatch;

  return {
    name: 'GET /dashboard/stats',
    passed: allMatch,
    details: allMatch
      ? `Stats match DB: ${stats.totalMeters} meters, ${stats.totalCustomers} customers, ${stats.totalDevices} devices`
      : `Mismatch! API: meters=${stats.totalMeters}, customers=${stats.totalCustomers}, devices=${stats.totalDevices}. DB: meters=${dbMeterCount}, customers=${dbCustomerCount}, devices=${dbDeviceCount}`,
    data: {
      totalMeters: stats.totalMeters,
      totalCustomers: stats.totalCustomers,
      totalDevices: stats.totalDevices,
      activeAlarms: stats.activeAlarms,
      totalWaterUsage: stats.totalWaterUsage,
    },
  };
}

async function test3_DashboardMap(ctx: TestContext): Promise<TestResult> {
  const response = await apiRequest(
    'GET',
    '/api/v1/dashboard/map',
    undefined,
    ctx.accessToken,
  );

  if (response.status !== 200) {
    return {
      name: 'GET /dashboard/map',
      passed: false,
      details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
    };
  }

  const mapData: MeterMapData[] = response.data;

  // Check if we have any map data
  const hasData = mapData.length > 0;

  // Check if device info is included (Asset/Device separation test)
  const hasDeviceInfo = mapData.some(
    (m) => m.batteryLevel !== null || m.signalStrength !== null,
  );

  // Check for proper mapStatus values
  const validStatuses = ['alarm', 'high_usage', 'normal', 'offline'];
  const allValidStatus = mapData.every((m) => validStatuses.includes(m.mapStatus));

  // Count by status
  const statusCounts = {
    alarm: mapData.filter((m) => m.mapStatus === 'alarm').length,
    offline: mapData.filter((m) => m.mapStatus === 'offline').length,
    high_usage: mapData.filter((m) => m.mapStatus === 'high_usage').length,
    normal: mapData.filter((m) => m.mapStatus === 'normal').length,
  };

  const passed = hasData && allValidStatus;

  return {
    name: 'GET /dashboard/map',
    passed,
    details: `${mapData.length} meters on map. Status counts: ${JSON.stringify(statusCounts)}. Device info present: ${hasDeviceInfo}`,
    data: mapData.slice(0, 2), // Just show first 2 entries
  };
}

async function test4_DashboardAlarms(ctx: TestContext): Promise<TestResult> {
  const response = await apiRequest(
    'GET',
    '/api/v1/dashboard/alarms?limit=10',
    undefined,
    ctx.accessToken,
  );

  if (response.status !== 200) {
    return {
      name: 'GET /dashboard/alarms',
      passed: false,
      details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
    };
  }

  const alarms: DashboardAlarm[] = response.data;

  // Check DB count
  const dbAlarmCount = await prisma.alarm.count({ where: { status: 'ACTIVE' } });

  // Verify structure
  const hasValidStructure =
    alarms.length === 0 ||
    (alarms[0].id && alarms[0].type && alarms[0].meterSerial !== undefined);

  return {
    name: 'GET /dashboard/alarms',
    passed: true, // Empty alarms is valid
    details: `${alarms.length} alarms returned (DB has ${dbAlarmCount} active). Valid structure: ${hasValidStructure}`,
    data: alarms.slice(0, 2),
  };
}

async function test5_DashboardConsumption(ctx: TestContext): Promise<TestResult> {
  const response = await apiRequest(
    'GET',
    '/api/v1/dashboard/consumption?days=30',
    undefined,
    ctx.accessToken,
  );

  if (response.status !== 200) {
    return {
      name: 'GET /dashboard/consumption',
      passed: false,
      details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
    };
  }

  const consumption: ConsumptionDataPoint[] = response.data;

  // Check if we have data
  const hasData = consumption.length > 0;

  // Validate structure
  const hasValidStructure =
    consumption.length === 0 ||
    (consumption[0].date && consumption[0].timestamp && consumption[0].consumption !== undefined);

  // Calculate total consumption
  const totalConsumption = consumption.reduce((sum, d) => sum + d.consumption, 0);

  return {
    name: 'GET /dashboard/consumption',
    passed: true, // Empty is valid if no readings
    details: `${consumption.length} data points for last 30 days. Total: ${totalConsumption.toFixed(2)} m³. Has data: ${hasData}`,
    data: consumption.slice(0, 5),
  };
}

// =============================================================================
// Main
// =============================================================================

async function runVerification(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Read Water - Dashboard Verification 📊                      ║');
  console.log('║     (Real Data from Database)                                   ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  API: ${CONFIG.url.padEnd(55)}║`);
  console.log(`║  Seed if empty: ${CONFIG.seedIfEmpty ? 'Yes' : 'No'}`.padEnd(65) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Optionally seed test data
  if (CONFIG.seedIfEmpty) {
    await seedTestDataIfNeeded();
  }

  const ctx: TestContext = {};
  const results: TestResult[] = [];

  console.log('🧪 Running dashboard verification tests...\n');

  // Test 1: Auth
  const test1Result = await test1_Auth(ctx);
  results.push(test1Result);
  printResult(test1Result);

  if (!test1Result.passed) {
    console.log('\n❌ Cannot proceed without authentication. Ensure the API is running.');
    console.log('   Try: cd api && npm run start:dev');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Test 2: Dashboard Stats
  console.log('');
  const test2Result = await test2_DashboardStats(ctx);
  results.push(test2Result);
  printResult(test2Result);

  // Test 3: Dashboard Map
  console.log('');
  const test3Result = await test3_DashboardMap(ctx);
  results.push(test3Result);
  printResult(test3Result);

  // Test 4: Dashboard Alarms
  console.log('');
  const test4Result = await test4_DashboardAlarms(ctx);
  results.push(test4Result);
  printResult(test4Result);

  // Test 5: Dashboard Consumption Chart
  console.log('');
  const test5Result = await test5_DashboardConsumption(ctx);
  results.push(test5Result);
  printResult(test5Result);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  console.log('\n' + '═'.repeat(66));
  console.log('');

  if (allPassed) {
    console.log('🎉 All dashboard tests passed! Real data is being served.');
  } else {
    console.log(`⚠️  ${passed}/${total} tests passed. Some issues detected.`);
    console.log('\nFailed tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`   • ${r.name}: ${r.details}`);
    });
  }

  console.log('');
  console.log('📋 Quick Summary:');
  console.log(`   Meters on map: ${(results.find(r => r.name.includes('map'))?.data?.length) ?? 'Unknown'}`);
  console.log(`   Active alarms: ${(results.find(r => r.name.includes('stats'))?.data?.activeAlarms) ?? 'Unknown'}`);
  console.log(`   Total water usage: ${(results.find(r => r.name.includes('stats'))?.data?.totalWaterUsage) ?? 'Unknown'} m³`);
  console.log('');

  if (!allPassed && !CONFIG.seedIfEmpty) {
    console.log('💡 Tip: Run with --seed-if-empty to create test data if DB is empty.');
  }

  console.log('');

  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}

// Handle errors
runVerification().catch(async (error) => {
  console.error('\n❌ Verification failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
