/**
 * =============================================================================
 * Read Water - Integration Verification Script
 * =============================================================================
 *
 * This script verifies the full integration after the Asset/Device refactor.
 * It simulates a complete user journey to ensure all endpoints work correctly.
 *
 * Tests:
 *   1. Auth: Login as Admin
 *   2. Bug Fix Check: Send PATCH to a Customer (was returning 404)
 *   3. Inventory: Create a Device
 *   4. Asset: Create a Meter
 *   5. Link: Call POST /meters/:id/link-device
 *   6. Data Flow: Send a dummy reading via Ingestion
 *
 * Usage:
 *   cd api
 *   npx ts-node scripts/verify-integration.ts
 *
 * Options:
 *   --url=http://...   API base URL (default: http://localhost:4000)
 *   --cleanup          Remove test data after completion
 *
 * =============================================================================
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, DeviceStatus, MeterStatus } from '@prisma/client';

const API_BASE = process.env.API_URL || 'http://localhost:4000';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value ?? 'true';
  return acc;
}, {} as Record<string, string>);

const CONFIG = {
  url: args.url || API_BASE,
  cleanup: args.cleanup === 'true',
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
  customerId?: string;
  deviceProfileId?: string;
  meterProfileId?: string;
  testDeviceId?: string;
  testMeterId?: string;
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
  if (!result.passed) {
    console.log(`      ${result.details}`);
  }
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
    // tenantId is directly in user object, not in user.tenants array
    ctx.tenantId = response.data.user?.tenantId;
    return {
      name: 'Auth: Login as Admin',
      passed: true,
      details: `Token obtained, tenantId: ${ctx.tenantId}`,
      data: response.data,
    };
  }

  return {
    name: 'Auth: Login as Admin',
    passed: false,
    details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
  };
}

async function test2_PatchCustomer(ctx: TestContext): Promise<TestResult> {
  // First, get existing customers
  const listResponse = await apiRequest(
    'GET',
    '/api/v1/customers?limit=1',
    undefined,
    ctx.accessToken,
  );

  if (listResponse.status !== 200 || !listResponse.data.data?.length) {
    return {
      name: 'Bug Fix Check: PATCH Customer',
      passed: false,
      details: `Failed to get customers: Status ${listResponse.status}`,
    };
  }

  ctx.customerId = listResponse.data.data[0].id;

  // Now test the PATCH endpoint (the bug fix)
  const patchResponse = await apiRequest(
    'PATCH',
    `/api/v1/customers/${ctx.customerId}`,
    {
      metadata: { verificationTest: new Date().toISOString() },
    },
    ctx.accessToken,
  );

  if (patchResponse.status === 200) {
    return {
      name: 'Bug Fix Check: PATCH Customer',
      passed: true,
      details: `Successfully patched customer ${ctx.customerId}`,
      data: patchResponse.data,
    };
  }

  return {
    name: 'Bug Fix Check: PATCH Customer',
    passed: false,
    details: `Status ${patchResponse.status}: ${JSON.stringify(patchResponse.data)}`,
  };
}

async function test3_GetProfiles(ctx: TestContext): Promise<TestResult> {
  // Get Device Profiles
  const deviceProfilesResponse = await apiRequest(
    'GET',
    '/api/v1/device-profiles?limit=1',
    undefined,
    ctx.accessToken,
  );

  if (deviceProfilesResponse.status !== 200 || !deviceProfilesResponse.data.data?.length) {
    return {
      name: 'Profiles: Get Device Profiles',
      passed: false,
      details: `Failed to get device profiles: Status ${deviceProfilesResponse.status}`,
    };
  }

  ctx.deviceProfileId = deviceProfilesResponse.data.data[0].id;

  // Get Meter Profiles
  const meterProfilesResponse = await apiRequest(
    'GET',
    '/api/v1/profiles?limit=1',
    undefined,
    ctx.accessToken,
  );

  if (meterProfilesResponse.status !== 200 || !meterProfilesResponse.data.data?.length) {
    return {
      name: 'Profiles: Get Meter Profiles',
      passed: false,
      details: `Failed to get meter profiles: Status ${meterProfilesResponse.status}`,
    };
  }

  ctx.meterProfileId = meterProfilesResponse.data.data[0].id;

  return {
    name: 'Profiles: Get Device & Meter Profiles',
    passed: true,
    details: `DeviceProfile: ${ctx.deviceProfileId}, MeterProfile: ${ctx.meterProfileId}`,
  };
}

async function test4_CreateDevice(ctx: TestContext): Promise<TestResult> {
  if (!ctx.tenantId) {
    return {
      name: 'Inventory: Create Device',
      passed: false,
      details: `No tenantId available from auth`,
    };
  }

  const deviceSerial = `VERIFY-DEV-${Date.now()}`;

  const response = await apiRequest(
    'POST',
    '/api/v1/devices',
    {
      tenantId: ctx.tenantId,
      deviceProfileId: ctx.deviceProfileId,
      serialNumber: deviceSerial,
      status: 'WAREHOUSE',
      dynamicFields: {
        DevEUI: 'abcd1234eeee5678',
        JoinEUI: '1234567890abcdef',
        AppKey: '00112233445566778899aabbccddeeff',
      },
    },
    ctx.accessToken,
  );

  if (response.status === 201 || response.status === 200) {
    ctx.testDeviceId = response.data.id;
    return {
      name: 'Inventory: Create Device',
      passed: true,
      details: `Created device ${deviceSerial} (${ctx.testDeviceId})`,
      data: response.data,
    };
  }

  return {
    name: 'Inventory: Create Device',
    passed: false,
    details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
  };
}

async function test5_CreateMeter(ctx: TestContext): Promise<TestResult> {
  if (!ctx.tenantId) {
    return {
      name: 'Asset: Create Meter',
      passed: false,
      details: `No tenantId available from auth`,
    };
  }

  const meterSerial = `VERIFY-MTR-${Date.now()}`;

  const response = await apiRequest(
    'POST',
    '/api/v1/meters',
    {
      tenantId: ctx.tenantId,
      customerId: ctx.customerId,
      meterProfileId: ctx.meterProfileId,
      serialNumber: meterSerial,
      initialIndex: 0,
      installationDate: new Date().toISOString(),
      status: 'WAREHOUSE',
      address: {
        city: 'Istanbul',
        district: 'Kadıköy',
        neighborhood: 'Test',
        street: 'Verification St.',
        buildingNo: '1',
      },
      latitude: 41.0082,
      longitude: 28.9784,
    },
    ctx.accessToken,
  );

  if (response.status === 201 || response.status === 200) {
    ctx.testMeterId = response.data.id;
    return {
      name: 'Asset: Create Meter',
      passed: true,
      details: `Created meter ${meterSerial} (${ctx.testMeterId})`,
      data: response.data,
    };
  }

  return {
    name: 'Asset: Create Meter',
    passed: false,
    details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
  };
}

async function test6_LinkDevice(ctx: TestContext): Promise<TestResult> {
  const response = await apiRequest(
    'POST',
    `/api/v1/meters/${ctx.testMeterId}/link-device`,
    {
      deviceId: ctx.testDeviceId,
    },
    ctx.accessToken,
  );

  if (response.status === 200 || response.status === 201) {
    return {
      name: 'Link: POST /meters/:id/link-device',
      passed: true,
      details: `Linked device ${ctx.testDeviceId} to meter ${ctx.testMeterId}`,
      data: response.data,
    };
  }

  return {
    name: 'Link: POST /meters/:id/link-device',
    passed: false,
    details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
  };
}

async function test7_VerifyLink(ctx: TestContext): Promise<TestResult> {
  // Verify device status changed
  const deviceResponse = await apiRequest(
    'GET',
    `/api/v1/devices/${ctx.testDeviceId}`,
    undefined,
    ctx.accessToken,
  );

  if (deviceResponse.status !== 200) {
    return {
      name: 'Verify: Device Status',
      passed: false,
      details: `Failed to get device: ${deviceResponse.status}`,
    };
  }

  const isDeviceActive = deviceResponse.data.status === 'ACTIVE' || deviceResponse.data.status === 'DEPLOYED';

  // Verify meter has device linked
  const meterResponse = await apiRequest(
    'GET',
    `/api/v1/meters/${ctx.testMeterId}`,
    undefined,
    ctx.accessToken,
  );

  if (meterResponse.status !== 200) {
    return {
      name: 'Verify: Link State',
      passed: false,
      details: `Failed to get meter: ${meterResponse.status}`,
    };
  }

  const isLinked = meterResponse.data.activeDeviceId === ctx.testDeviceId;

  if (isDeviceActive && isLinked) {
    return {
      name: 'Verify: Link State',
      passed: true,
      details: `Device active, meter linked correctly`,
    };
  }

  return {
    name: 'Verify: Link State',
    passed: false,
    details: `Device active: ${isDeviceActive}, Meter linked: ${isLinked}`,
  };
}

async function test8_Ingestion(ctx: TestContext): Promise<TestResult> {
  // Send a reading via the ingestion endpoint
  // Use the seeded device (UNA-LW-001) that is already linked to MTR-2024-001
  const response = await apiRequest('POST', '/api/v1/ingest', {
    deviceId: '0011223344556677', // DevEUI from seeded UNA-LW-001 device
    payload: '00015F90640A', // Sample payload: value=89.488, battery=100, signal=10
    technology: 'LORAWAN',
    timestamp: new Date().toISOString(),
    metadata: {
      test: true,
      verificationRun: Date.now(),
    },
  });

  // 202 Accepted means the job was queued successfully
  if (response.status === 202 || response.status === 200) {
    return {
      name: 'Data Flow: Ingestion Endpoint',
      passed: true,
      details: `Job queued: ${response.data.jobId || 'success'}`,
      data: response.data,
    };
  }

  // 400/404 might be expected if device lookup fails (depends on exact DevEUI format)
  return {
    name: 'Data Flow: Ingestion Endpoint',
    passed: false,
    details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
  };
}

// =============================================================================
// Cleanup
// =============================================================================

async function cleanup(ctx: TestContext): Promise<void> {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Unlink device from meter first
    if (ctx.testMeterId) {
      await prisma.meter.update({
        where: { id: ctx.testMeterId },
        data: { activeDeviceId: null },
      }).catch(() => {});

      await prisma.meter.delete({
        where: { id: ctx.testMeterId },
      }).catch(() => {});
      console.log(`   ✓ Deleted test meter: ${ctx.testMeterId}`);
    }

    if (ctx.testDeviceId) {
      await prisma.device.delete({
        where: { id: ctx.testDeviceId },
      }).catch(() => {});
      console.log(`   ✓ Deleted test device: ${ctx.testDeviceId}`);
    }
  } catch (error) {
    console.log(`   ⚠ Cleanup error: ${error}`);
  }
}

// =============================================================================
// Main
// =============================================================================

async function runVerification(): Promise<void> {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Read Water - Integration Verification 🔍                   ║');
  console.log('║     (Post Asset/Device Refactor)                               ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  API: ${CONFIG.url.padEnd(55)}║`);
  console.log(`║  Cleanup: ${CONFIG.cleanup ? 'Yes' : 'No'}`.padEnd(65) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  const ctx: TestContext = {};
  const results: TestResult[] = [];

  console.log('🧪 Running integration tests...\n');

  // Test 1: Auth
  const test1Result = await test1_Auth(ctx);
  results.push(test1Result);
  printResult(test1Result);

  if (!test1Result.passed) {
    console.log('\n❌ Cannot proceed without authentication. Ensure the API is running.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Test 2: PATCH Customer (Bug Fix)
  const test2Result = await test2_PatchCustomer(ctx);
  results.push(test2Result);
  printResult(test2Result);

  // Test 3: Get Profiles
  const test3Result = await test3_GetProfiles(ctx);
  results.push(test3Result);
  printResult(test3Result);

  if (!test3Result.passed) {
    console.log('\n❌ Cannot proceed without profiles. Run seed first: npx prisma migrate reset --force');
    await prisma.$disconnect();
    process.exit(1);
  }

  // Test 4: Create Device
  const test4Result = await test4_CreateDevice(ctx);
  results.push(test4Result);
  printResult(test4Result);

  // Test 5: Create Meter
  const test5Result = await test5_CreateMeter(ctx);
  results.push(test5Result);
  printResult(test5Result);

  // Test 6: Link Device to Meter
  if (test4Result.passed && test5Result.passed) {
    const test6Result = await test6_LinkDevice(ctx);
    results.push(test6Result);
    printResult(test6Result);

    // Test 7: Verify Link
    if (test6Result.passed) {
      const test7Result = await test7_VerifyLink(ctx);
      results.push(test7Result);
      printResult(test7Result);
    }
  }

  // Test 8: Ingestion (optional, may fail if device not properly registered)
  const test8Result = await test8_Ingestion(ctx);
  results.push(test8Result);
  printResult(test8Result);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  console.log('\n' + '═'.repeat(66));
  console.log('');

  if (allPassed) {
    console.log('🎉 All tests passed! Integration verified successfully.');
  } else {
    console.log(`⚠️  ${passed}/${total} tests passed. Some issues detected.`);
    console.log('\nFailed tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`   • ${r.name}: ${r.details}`);
    });
  }

  console.log('');

  // Cleanup if requested
  if (CONFIG.cleanup) {
    await cleanup(ctx);
  } else {
    console.log('💡 Run with --cleanup flag to remove test data after completion.');
    console.log(`   Test Device ID: ${ctx.testDeviceId}`);
    console.log(`   Test Meter ID: ${ctx.testMeterId}`);
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
