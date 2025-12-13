"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const client_1 = require("@prisma/client");
const API_BASE = process.env.API_URL || 'http://localhost:4000';
const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.replace('--', '').split('=');
    acc[key] = value ?? 'true';
    return acc;
}, {});
const CONFIG = {
    url: args.url || API_BASE,
    cleanup: args.cleanup === 'true',
};
const prisma = new client_1.PrismaClient();
async function apiRequest(method, path, body, token) {
    const headers = {
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
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        }
        else {
            data = await response.text();
        }
        return { status: response.status, data };
    }
    catch (error) {
        return { status: 0, data: { error: String(error) } };
    }
}
function printResult(result) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`   ${icon} ${result.name}`);
    if (!result.passed) {
        console.log(`      ${result.details}`);
    }
}
async function test1_Auth(ctx) {
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
async function test2_PatchCustomer(ctx) {
    const listResponse = await apiRequest('GET', '/api/v1/customers?limit=1', undefined, ctx.accessToken);
    if (listResponse.status !== 200 || !listResponse.data.data?.length) {
        return {
            name: 'Bug Fix Check: PATCH Customer',
            passed: false,
            details: `Failed to get customers: Status ${listResponse.status}`,
        };
    }
    ctx.customerId = listResponse.data.data[0].id;
    const patchResponse = await apiRequest('PATCH', `/api/v1/customers/${ctx.customerId}`, {
        metadata: { verificationTest: new Date().toISOString() },
    }, ctx.accessToken);
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
async function test3_GetProfiles(ctx) {
    const deviceProfilesResponse = await apiRequest('GET', '/api/v1/device-profiles?limit=1', undefined, ctx.accessToken);
    if (deviceProfilesResponse.status !== 200 || !deviceProfilesResponse.data.data?.length) {
        return {
            name: 'Profiles: Get Device Profiles',
            passed: false,
            details: `Failed to get device profiles: Status ${deviceProfilesResponse.status}`,
        };
    }
    ctx.deviceProfileId = deviceProfilesResponse.data.data[0].id;
    const meterProfilesResponse = await apiRequest('GET', '/api/v1/profiles?limit=1', undefined, ctx.accessToken);
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
async function test4_CreateDevice(ctx) {
    if (!ctx.tenantId) {
        return {
            name: 'Inventory: Create Device',
            passed: false,
            details: `No tenantId available from auth`,
        };
    }
    const deviceSerial = `VERIFY-DEV-${Date.now()}`;
    const response = await apiRequest('POST', '/api/v1/devices', {
        tenantId: ctx.tenantId,
        deviceProfileId: ctx.deviceProfileId,
        serialNumber: deviceSerial,
        status: 'WAREHOUSE',
        dynamicFields: {
            DevEUI: 'abcd1234eeee5678',
            JoinEUI: '1234567890abcdef',
            AppKey: '00112233445566778899aabbccddeeff',
        },
    }, ctx.accessToken);
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
async function test5_CreateMeter(ctx) {
    if (!ctx.tenantId) {
        return {
            name: 'Asset: Create Meter',
            passed: false,
            details: `No tenantId available from auth`,
        };
    }
    const meterSerial = `VERIFY-MTR-${Date.now()}`;
    const response = await apiRequest('POST', '/api/v1/meters', {
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
    }, ctx.accessToken);
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
async function test6_LinkDevice(ctx) {
    const response = await apiRequest('POST', `/api/v1/meters/${ctx.testMeterId}/link-device`, {
        deviceId: ctx.testDeviceId,
    }, ctx.accessToken);
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
async function test7_VerifyLink(ctx) {
    const deviceResponse = await apiRequest('GET', `/api/v1/devices/${ctx.testDeviceId}`, undefined, ctx.accessToken);
    if (deviceResponse.status !== 200) {
        return {
            name: 'Verify: Device Status',
            passed: false,
            details: `Failed to get device: ${deviceResponse.status}`,
        };
    }
    const isDeviceActive = deviceResponse.data.status === 'ACTIVE' || deviceResponse.data.status === 'DEPLOYED';
    const meterResponse = await apiRequest('GET', `/api/v1/meters/${ctx.testMeterId}`, undefined, ctx.accessToken);
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
async function test8_Ingestion(ctx) {
    const response = await apiRequest('POST', '/api/v1/ingest', {
        deviceId: '0011223344556677',
        payload: '00015F90640A',
        technology: 'LORAWAN',
        timestamp: new Date().toISOString(),
        metadata: {
            test: true,
            verificationRun: Date.now(),
        },
    });
    if (response.status === 202 || response.status === 200) {
        return {
            name: 'Data Flow: Ingestion Endpoint',
            passed: true,
            details: `Job queued: ${response.data.jobId || 'success'}`,
            data: response.data,
        };
    }
    return {
        name: 'Data Flow: Ingestion Endpoint',
        passed: false,
        details: `Status ${response.status}: ${JSON.stringify(response.data)}`,
    };
}
async function cleanup(ctx) {
    console.log('\n🧹 Cleaning up test data...');
    try {
        if (ctx.testMeterId) {
            await prisma.meter.update({
                where: { id: ctx.testMeterId },
                data: { activeDeviceId: null },
            }).catch(() => { });
            await prisma.meter.delete({
                where: { id: ctx.testMeterId },
            }).catch(() => { });
            console.log(`   ✓ Deleted test meter: ${ctx.testMeterId}`);
        }
        if (ctx.testDeviceId) {
            await prisma.device.delete({
                where: { id: ctx.testDeviceId },
            }).catch(() => { });
            console.log(`   ✓ Deleted test device: ${ctx.testDeviceId}`);
        }
    }
    catch (error) {
        console.log(`   ⚠ Cleanup error: ${error}`);
    }
}
async function runVerification() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Read Water - Integration Verification 🔍                   ║');
    console.log('║     (Post Asset/Device Refactor)                               ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  API: ${CONFIG.url.padEnd(55)}║`);
    console.log(`║  Cleanup: ${CONFIG.cleanup ? 'Yes' : 'No'}`.padEnd(65) + '║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    const ctx = {};
    const results = [];
    console.log('🧪 Running integration tests...\n');
    const test1Result = await test1_Auth(ctx);
    results.push(test1Result);
    printResult(test1Result);
    if (!test1Result.passed) {
        console.log('\n❌ Cannot proceed without authentication. Ensure the API is running.');
        await prisma.$disconnect();
        process.exit(1);
    }
    const test2Result = await test2_PatchCustomer(ctx);
    results.push(test2Result);
    printResult(test2Result);
    const test3Result = await test3_GetProfiles(ctx);
    results.push(test3Result);
    printResult(test3Result);
    if (!test3Result.passed) {
        console.log('\n❌ Cannot proceed without profiles. Run seed first: npx prisma migrate reset --force');
        await prisma.$disconnect();
        process.exit(1);
    }
    const test4Result = await test4_CreateDevice(ctx);
    results.push(test4Result);
    printResult(test4Result);
    const test5Result = await test5_CreateMeter(ctx);
    results.push(test5Result);
    printResult(test5Result);
    if (test4Result.passed && test5Result.passed) {
        const test6Result = await test6_LinkDevice(ctx);
        results.push(test6Result);
        printResult(test6Result);
        if (test6Result.passed) {
            const test7Result = await test7_VerifyLink(ctx);
            results.push(test7Result);
            printResult(test7Result);
        }
    }
    const test8Result = await test8_Ingestion(ctx);
    results.push(test8Result);
    printResult(test8Result);
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const allPassed = passed === total;
    console.log('\n' + '═'.repeat(66));
    console.log('');
    if (allPassed) {
        console.log('🎉 All tests passed! Integration verified successfully.');
    }
    else {
        console.log(`⚠️  ${passed}/${total} tests passed. Some issues detected.`);
        console.log('\nFailed tests:');
        results.filter((r) => !r.passed).forEach((r) => {
            console.log(`   • ${r.name}: ${r.details}`);
        });
    }
    console.log('');
    if (CONFIG.cleanup) {
        await cleanup(ctx);
    }
    else {
        console.log('💡 Run with --cleanup flag to remove test data after completion.');
        console.log(`   Test Device ID: ${ctx.testDeviceId}`);
        console.log(`   Test Meter ID: ${ctx.testMeterId}`);
    }
    console.log('');
    await prisma.$disconnect();
    process.exit(allPassed ? 0 : 1);
}
runVerification().catch(async (error) => {
    console.error('\n❌ Verification failed:', error);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=verify-integration.js.map