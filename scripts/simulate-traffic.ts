/**
 * =============================================================================
 * Read Water - Traffic Simulator - Updated for Subscription Model
 * =============================================================================
 * 
 * This script simulates high-volume IoT meter readings to test the ingestion
 * pipeline: HTTP Ingest -> BullMQ -> Worker -> TimescaleDB -> Socket.IO -> UI
 * 
 * ARCHITECTURE (Updated):
 * - Creates DeviceProfiles with decoder functions
 * - Creates Devices (communication units) in inventory
 * - Creates Customers (registry of people/orgs)
 * - Creates Subscriptions (service points with addresses)
 * - Creates Meters (pure assets) linked to Subscriptions
 * - Links Devices to Meters (simulating deployment)
 * 
 * Usage:
 *   cd api
 *   npx ts-node scripts/simulate-traffic.ts
 * 
 * Options:
 *   --meters=100       Number of unique meters (default: 100)
 *   --rps=50           Requests per second (default: 50)
 *   --duration=60      Duration in seconds (default: 60)
 *   --url=http://...   API base URL (default: http://localhost:4000)
 *   --cleanup          Remove simulator data after completion
 * 
 * =============================================================================
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import {
  PrismaClient,
  CommunicationTechnology,
  MeterStatus,
  DeviceStatus,
  Brand,
  DeviceBrand,
  MeterType,
  DialType,
  CommunicationModule,
  IPRating,
  TenantSubscriptionStatus,
  ConnectionType,
  MountingType,
  TemperatureType,
  IntegrationType,
  CustomerType,
  SubscriptionType,
  SubscriptionGroup,
} from '@prisma/client';

const API_BASE = process.env.API_URL || 'http://localhost:4000';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value ?? 'true';
  return acc;
}, {} as Record<string, string>);

const CONFIG = {
  meters: parseInt(args.meters || '100'),
  rps: parseInt(args.rps || '50'),
  duration: parseInt(args.duration || '60'),
  url: args.url || API_BASE,
  cleanup: args.cleanup === 'true',
};

// Prisma client for setup
const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

interface SimulatorDevice {
  deviceId: string; // Internal UUID
  serialNumber: string;
  deviceIdentifier: string; // DevEUI, Sigfox ID, etc.
  technology: CommunicationTechnology;
  meterId: string;
  meterSerial: string;
  currentIndex: number;
}

interface Stats {
  sent: number;
  successful: number;
  failed: number;
  totalLatency: number;
  startTime: number;
  lastErrors: string[];
}

const stats: Stats = {
  sent: 0,
  successful: 0,
  failed: 0,
  totalLatency: 0,
  startTime: 0,
  lastErrors: [],
};

// =============================================================================
// Utility Functions
// =============================================================================

function randomHex(length: number): string {
  let result = '';
  const chars = '0123456789ABCDEF';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function getDeviceIdFieldName(technology: CommunicationTechnology): string {
  switch (technology) {
    case CommunicationTechnology.LORAWAN:
      return 'DevEUI';
    case CommunicationTechnology.SIGFOX:
      return 'ID';
    case CommunicationTechnology.NB_IOT:
      return 'IMEI';
    default:
      return 'DeviceId';
  }
}

function generateDeviceIdentifier(technology: CommunicationTechnology): string {
  switch (technology) {
    case CommunicationTechnology.LORAWAN:
      return randomHex(16); // DevEUI: 16 hex chars
    case CommunicationTechnology.SIGFOX:
      return randomHex(8); // Sigfox ID: 8 hex chars
    case CommunicationTechnology.NB_IOT:
      return '35' + randomHex(13).replace(/[A-F]/g, () => Math.floor(Math.random() * 10).toString()); // IMEI: 15 digits
    default:
      return randomHex(16);
  }
}

function generateDynamicFields(technology: CommunicationTechnology, deviceIdentifier: string): Record<string, string> {
  const fieldName = getDeviceIdFieldName(technology);
  const fields: Record<string, string> = {
    [fieldName]: deviceIdentifier,
  };

  if (technology === CommunicationTechnology.LORAWAN) {
    fields['JoinEUI'] = randomHex(16);
    fields['AppKey'] = randomHex(32);
  } else if (technology === CommunicationTechnology.SIGFOX) {
    fields['PAC'] = randomHex(16);
  } else if (technology === CommunicationTechnology.NB_IOT) {
    fields['IMSI'] = '310' + randomHex(12).replace(/[A-F]/g, () => Math.floor(Math.random() * 10).toString());
  }

  return fields;
}

// =============================================================================
// Setup Phase - Create Real Data with Subscription Model
// =============================================================================

async function setupSimulatorData(): Promise<SimulatorDevice[]> {
  console.log('📦 Setting up simulator data (Subscription-based architecture)...\n');

  // 1. Get or create root tenant
  let tenant = await prisma.tenant.findFirst({
    where: { path: 'Root' },
  });

  if (!tenant) {
    console.log('   Creating root tenant...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'Root Tenant',
        path: 'Root',
        tenantSubscriptionStatus: TenantSubscriptionStatus.ACTIVE,
        subscriptionPlan: 'ENTERPRISE',
      },
    });
  }
  console.log(`   ✓ Using tenant: ${tenant.name} (${tenant.id})`);

  // 2. Get or create simulator device profiles (one per technology)
  const technologies = [
    CommunicationTechnology.LORAWAN,
    CommunicationTechnology.SIGFOX,
    CommunicationTechnology.NB_IOT,
  ];

  const deviceProfiles: Record<CommunicationTechnology, string> = {} as any;

  for (const tech of technologies) {
    let profile = await prisma.deviceProfile.findFirst({
      where: { modelCode: `SIM-${tech}` },
    });

    if (!profile) {
      console.log(`   Creating device profile for ${tech}...`);
      profile = await prisma.deviceProfile.create({
        data: {
          brand: DeviceBrand.UNA,
          modelCode: `SIM-${tech}`,
          communicationTechnology: tech,
          integrationType: IntegrationType.HTTP,
          fieldDefinitions: [
            { name: getDeviceIdFieldName(tech), type: 'hex', required: true },
          ],
          decoderFunction: `
// Simulator decoder for ${tech}
function decode(payload) {
  const bytes = Buffer.from(payload, 'hex');
  const value = bytes.readUInt32BE(0) / 1000;
  const batteryLevel = bytes.length > 4 ? bytes.readUInt8(4) : null;
  const signalStrength = bytes.length > 5 ? bytes.readInt8(5) : null;
  return { value, batteryLevel, signalStrength, unit: 'm3' };
}`.trim(),
          batteryLifeMonths: 120,
        },
      });
    }
    deviceProfiles[tech] = profile.id;
  }
  console.log(`   ✓ Device profiles ready`);

  // 3. Get or create simulator meter profile
  let meterProfile = await prisma.meterProfile.findFirst({
    where: { modelCode: 'SIMULATOR-001' },
  });

  if (!meterProfile) {
    console.log('   Creating simulator meter profile...');
    meterProfile = await prisma.meterProfile.create({
      data: {
        brand: Brand.BAYLAN,
        modelCode: 'SIMULATOR-001',
        meterType: MeterType.ULTRASONIC,
        dialType: DialType.DRY,
        connectionType: ConnectionType.THREAD,
        mountingType: MountingType.HORIZONTAL,
        temperatureType: TemperatureType.T30,
        ipRating: IPRating.IP68,
        communicationModule: CommunicationModule.RETROFIT,
        compatibleDeviceProfiles: {
          connect: Object.values(deviceProfiles).map((id) => ({ id })),
        },
      },
    });
  }
  console.log(`   ✓ Meter profile ready: ${meterProfile.brand} ${meterProfile.modelCode}`);

  // 4. Get or create simulator customer (no address - that's on subscription now)
  let customer = await prisma.customer.findFirst({
    where: {
      tenantId: tenant.id,
      details: { path: ['organizationName'], equals: 'Simulator Customer' },
    },
  });

  if (!customer) {
    console.log('   Creating simulator customer...');
    customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        customerNumber: `SIM-CUST-${Date.now()}`,
        customerType: CustomerType.ORGANIZATIONAL,
        details: {
          organizationName: 'Simulator Customer',
          taxId: '0000000000',
          contactFirstName: 'Simulator',
          contactLastName: 'Test',
        },
      },
    });
  }
  console.log(`   ✓ Customer ready: ${customer.id}`);

  // 5. Delete existing simulator data (from previous runs)
  const existingDevices = await prisma.device.count({
    where: { serialNumber: { startsWith: 'SIM-DEV-' } },
  });
  const existingMeters = await prisma.meter.count({
    where: { serialNumber: { startsWith: 'SIM-MTR-' } },
  });
  const existingSubscriptions = await prisma.subscription.count({
    where: { addressCode: { startsWith: 'SIM-SUB-' } },
  });

  if (existingMeters > 0 || existingDevices > 0 || existingSubscriptions > 0) {
    console.log(`   Cleaning up ${existingMeters} meters, ${existingDevices} devices, ${existingSubscriptions} subscriptions...`);
    
    // First unlink devices from meters
    await prisma.meter.updateMany({
      where: { serialNumber: { startsWith: 'SIM-MTR-' } },
      data: { activeDeviceId: null },
    });
    
    await prisma.meter.deleteMany({
      where: { serialNumber: { startsWith: 'SIM-MTR-' } },
    });
    await prisma.subscription.deleteMany({
      where: { addressCode: { startsWith: 'SIM-SUB-' } },
    });
    await prisma.device.deleteMany({
      where: { serialNumber: { startsWith: 'SIM-DEV-' } },
    });
  }

  // 6. Create new simulator devices, subscriptions, and meters
  console.log(`   Creating ${CONFIG.meters} simulator devices, subscriptions, and meters...`);

  const simulatorDevices: SimulatorDevice[] = [];

  for (let i = 0; i < CONFIG.meters; i++) {
    const technology = technologies[i % technologies.length];
    const deviceIdentifier = generateDeviceIdentifier(technology);
    const deviceSerial = `SIM-DEV-${String(i + 1).padStart(5, '0')}`;
    const meterSerial = `SIM-MTR-${String(i + 1).padStart(5, '0')}`;
    const subscriptionCode = `SIM-SUB-${String(i + 1).padStart(5, '0')}`;
    const dynamicFields = generateDynamicFields(technology, deviceIdentifier);

    // Random coordinates in Ankara area
    const latitude = 39.9334 + (Math.random() - 0.5) * 0.1;
    const longitude = 32.8597 + (Math.random() - 0.5) * 0.1;

    // Create device
    const device = await prisma.device.create({
      data: {
        tenantId: tenant.id,
        deviceProfileId: deviceProfiles[technology],
        serialNumber: deviceSerial,
        status: DeviceStatus.WAREHOUSE,
        dynamicFields,
      },
    });

    // Create subscription (address is HERE now)
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        subscriptionNumber: subscriptionCode,
        subscriptionType: SubscriptionType.ORGANIZATIONAL,
        subscriptionGroup: SubscriptionGroup.NORMAL_CONSUMPTION,
        address: {
          city: 'Ankara',
          district: 'Çankaya',
          neighborhood: 'Simulator',
        },
        addressCode: subscriptionCode,
        latitude,
        longitude,
        isActive: true,
      },
    });

    // Create meter linked to subscription (no address on meter anymore)
    const meter = await prisma.meter.create({
      data: {
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        meterProfileId: meterProfile.id,
        serialNumber: meterSerial,
        initialIndex: 0,
        installationDate: new Date(),
        status: MeterStatus.ACTIVE,
      },
    });

    // Link device to meter (simulate deployment)
    await prisma.device.update({
      where: { id: device.id },
      data: { status: DeviceStatus.DEPLOYED },
    });

    await prisma.meter.update({
      where: { id: meter.id },
      data: { activeDeviceId: device.id },
    });

    simulatorDevices.push({
      deviceId: device.id,
      serialNumber: deviceSerial,
      deviceIdentifier: deviceIdentifier.toLowerCase(),
      technology,
      meterId: meter.id,
      meterSerial,
      currentIndex: 0,
    });

    // Progress indicator
    if ((i + 1) % 20 === 0 || i === CONFIG.meters - 1) {
      process.stdout.write(`\r   Creating: ${i + 1}/${CONFIG.meters}`);
    }
  }

  console.log('\n   ✓ Simulator data created\n');

  // Print sample info
  console.log('   Sample devices:');
  simulatorDevices.slice(0, 3).forEach((d) => {
    console.log(`     - ${d.serialNumber} (${d.technology}): ${d.deviceIdentifier} -> ${d.meterSerial}`);
  });
  console.log('');

  return simulatorDevices;
}

// =============================================================================
// Cleanup Phase
// =============================================================================

async function cleanupSimulatorData(): Promise<void> {
  console.log('\n🧹 Cleaning up simulator data...');

  // First unlink devices from meters
  await prisma.meter.updateMany({
    where: { serialNumber: { startsWith: 'SIM-MTR-' } },
    data: { activeDeviceId: null },
  });

  const deletedMeters = await prisma.meter.deleteMany({
    where: { serialNumber: { startsWith: 'SIM-MTR-' } },
  });

  const deletedSubscriptions = await prisma.subscription.deleteMany({
    where: { addressCode: { startsWith: 'SIM-SUB-' } },
  });

  const deletedDevices = await prisma.device.deleteMany({
    where: { serialNumber: { startsWith: 'SIM-DEV-' } },
  });

  console.log(`   ✓ Deleted ${deletedMeters.count} meters, ${deletedSubscriptions.count} subscriptions, and ${deletedDevices.count} devices`);
}

// =============================================================================
// Simulation Functions
// =============================================================================

function generatePayload(device: SimulatorDevice): string {
  // Increment meter index by random consumption (0.001 - 0.1 m³)
  device.currentIndex += Math.random() * 0.099 + 0.001;

  // Create payload: INDEX(8) + BATTERY(2) + SIGNAL(2) = 12 hex chars
  const indexHex = Math.floor(device.currentIndex * 1000).toString(16).padStart(8, '0').toUpperCase();
  const batteryHex = Math.floor(Math.random() * 100).toString(16).padStart(2, '0').toUpperCase();
  const signalHex = Math.floor(Math.random() * 30 + 70).toString(16).padStart(2, '0').toUpperCase();

  return indexHex + batteryHex + signalHex;
}

function buildIngestRequest(device: SimulatorDevice) {
  const payload = generatePayload(device);

  return {
    deviceId: device.deviceIdentifier, // DevEUI, Sigfox ID, etc.
    payload,
    technology: device.technology,
    timestamp: new Date().toISOString(),
    metadata: {
      rssi: Math.floor(Math.random() * 30) - 110,
      snr: Math.floor(Math.random() * 20) - 5,
      simulator: true,
    },
  };
}

async function sendRequest(device: SimulatorDevice): Promise<void> {
  const body = buildIngestRequest(device);
  const startTime = Date.now();

  try {
    const response = await fetch(`${CONFIG.url}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const latency = Date.now() - startTime;
    stats.totalLatency += latency;
    stats.sent++;

    if (response.ok || response.status === 202) {
      stats.successful++;
    } else {
      stats.failed++;

      if (stats.lastErrors.length < 10) {
        try {
          const errorBody = await response.text();
          const errorMsg = `[${response.status}] ${device.serialNumber}: ${errorBody.slice(0, 200)}`;
          stats.lastErrors.push(errorMsg);
        } catch {
          stats.lastErrors.push(`[${response.status}] ${response.statusText}`);
        }
      }
    }
  } catch (error) {
    stats.failed++;
    stats.sent++;
    if (stats.lastErrors.length < 10) {
      stats.lastErrors.push(`Network error: ${error}`);
    }
  }
}

function printProgress(): void {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const actualRps = elapsed > 0 ? stats.sent / elapsed : 0;
  const avgLatency = stats.sent > 0 ? stats.totalLatency / stats.sent : 0;
  const successRate = stats.sent > 0 ? ((stats.successful / stats.sent) * 100).toFixed(1) : '0';

  process.stdout.write(
    `\r📊 Sent: ${stats.sent} | Success: ${stats.successful} | Failed: ${stats.failed} | ` +
      `RPS: ${actualRps.toFixed(1)} | Latency: ${avgLatency.toFixed(0)}ms | Success: ${successRate}%`,
  );
}

// =============================================================================
// Main Simulation
// =============================================================================

async function runSimulation(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          Read Water - Traffic Simulator 🌊                     ║');
  console.log('║          (Subscription-based Architecture)                     ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Meters: ${CONFIG.meters.toString().padEnd(10)} │ RPS Target: ${CONFIG.rps.toString().padEnd(10)}       ║`);
  console.log(`║  Duration: ${CONFIG.duration}s          │ API: ${CONFIG.url.slice(0, 25).padEnd(25)} ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  // SETUP PHASE: Create real data
  const devices = await setupSimulatorData();

  // Calculate interval between requests
  const intervalMs = 1000 / CONFIG.rps;
  const totalRequests = CONFIG.rps * CONFIG.duration;

  console.log(`🚀 Starting simulation: ~${totalRequests} requests over ${CONFIG.duration} seconds`);
  console.log('   Press Ctrl+C to stop early');
  console.log('');

  stats.startTime = Date.now();
  let requestIndex = 0;

  // Progress printing interval
  const progressInterval = setInterval(printProgress, 500);

  // Main request loop
  const endTime = stats.startTime + CONFIG.duration * 1000;

  while (Date.now() < endTime) {
    const device = devices[requestIndex % devices.length];

    // Fire and forget (don't await to maintain RPS)
    sendRequest(device);

    requestIndex++;

    // Wait for next interval
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // Wait for pending requests to complete
  console.log('\n\n⏳ Waiting for pending requests to complete...');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  clearInterval(progressInterval);
  printProgress();

  // Final stats
  const totalTime = (Date.now() - stats.startTime) / 1000;
  const actualRps = stats.sent / totalTime;
  const avgLatency = stats.sent > 0 ? stats.totalLatency / stats.sent : 0;

  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    Simulation Complete! ✅                     ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Requests:   ${stats.sent.toString().padEnd(10)}                              ║`);
  console.log(`║  Successful:       ${stats.successful.toString().padEnd(10)} (${((stats.successful / stats.sent) * 100).toFixed(1)}%)                     ║`);
  console.log(`║  Failed:           ${stats.failed.toString().padEnd(10)}                              ║`);
  console.log(`║  Actual RPS:       ${actualRps.toFixed(1).padEnd(10)}                              ║`);
  console.log(`║  Avg Latency:      ${avgLatency.toFixed(0)}ms`.padEnd(65) + '║');
  console.log(`║  Total Time:       ${totalTime.toFixed(1)}s`.padEnd(65) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // Print errors if any
  if (stats.lastErrors.length > 0) {
    console.log('\n⚠️  Sample Errors:');
    stats.lastErrors.slice(0, 5).forEach((err) => {
      console.log(`   ${err}`);
    });
  }

  console.log('');
  console.log('💡 Check the frontend Live Readings page to see real-time updates!');
  console.log('');

  // Cleanup if requested
  if (CONFIG.cleanup) {
    await cleanupSimulatorData();
  } else {
    console.log('💡 Run with --cleanup flag to remove simulator data after completion.');
  }
}

// =============================================================================
// Entry Point
// =============================================================================

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Simulation interrupted by user');
  const totalTime = (Date.now() - stats.startTime) / 1000;
  console.log(`📊 Partial results: ${stats.sent} requests in ${totalTime.toFixed(1)}s`);

  if (CONFIG.cleanup) {
    await cleanupSimulatorData();
  }

  await prisma.$disconnect();
  process.exit(0);
});

// Run the simulation
runSimulation()
  .catch(async (error) => {
    console.error('\n❌ Simulation failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
