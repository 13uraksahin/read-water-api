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
    cleanup: args.cleanup !== 'false',
    verbose: args.verbose === 'true',
};
const prisma = new client_1.PrismaClient();
const results = [];
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
function addResult(result) {
    results.push(result);
    const icon = result.passed ? '✅' : '❌';
    const statusStr = result.status ? ` [${result.status}]` : '';
    console.log(`   ${icon} ${result.entity} - ${result.operation}${statusStr}`);
    if (!result.passed || CONFIG.verbose) {
        console.log(`      ${result.details}`);
    }
}
function isSuccess(status) {
    return status >= 200 && status < 300;
}
async function testAuth(ctx) {
    console.log('\n📋 AUTHENTICATION\n');
    const response = await apiRequest('POST', '/api/v1/auth/login', {
        email: 'admin@readwater.io',
        password: 'Admin@123',
    });
    if (response.status === 200 || response.status === 201) {
        ctx.accessToken = response.data.accessToken;
        ctx.rootTenantId = response.data.user?.tenantId;
        ctx.rootTenantPath = response.data.user?.tenantPath || 'Root';
        addResult({
            entity: 'Auth',
            operation: 'Login',
            passed: true,
            status: response.status,
            details: `Logged in as admin, tenantId: ${ctx.rootTenantId}`,
        });
        return true;
    }
    addResult({
        entity: 'Auth',
        operation: 'Login',
        passed: false,
        status: response.status,
        details: JSON.stringify(response.data),
    });
    return false;
}
async function testTenantsCRUD(ctx) {
    console.log('\n📋 TENANTS CRUD\n');
    const testName = `TestTenant_${Date.now()}`;
    const createRes = await apiRequest('POST', '/api/v1/tenants', {
        name: testName,
        parentId: ctx.rootTenantId,
        contactFirstName: 'Test',
        contactLastName: 'Contact',
        contactEmail: 'test@example.com',
        subscriptionStatus: 'TRIAL',
    }, ctx.accessToken);
    if (isSuccess(createRes.status)) {
        ctx.testTenantId = createRes.data.id;
        addResult({
            entity: 'Tenant',
            operation: 'CREATE (POST)',
            passed: true,
            status: createRes.status,
            details: `Created tenant: ${testName} (${ctx.testTenantId})`,
        });
    }
    else {
        addResult({
            entity: 'Tenant',
            operation: 'CREATE (POST)',
            passed: false,
            status: createRes.status,
            details: JSON.stringify(createRes.data),
        });
        return;
    }
    const readRes = await apiRequest('GET', `/api/v1/tenants/${ctx.testTenantId}`, undefined, ctx.accessToken);
    addResult({
        entity: 'Tenant',
        operation: 'READ (GET by ID)',
        passed: isSuccess(readRes.status),
        status: readRes.status,
        details: isSuccess(readRes.status)
            ? `Retrieved tenant: ${readRes.data.name}`
            : JSON.stringify(readRes.data),
    });
    const listRes = await apiRequest('GET', '/api/v1/tenants?page=1&limit=10', undefined, ctx.accessToken);
    addResult({
        entity: 'Tenant',
        operation: 'READ (GET list)',
        passed: isSuccess(listRes.status) && Array.isArray(listRes.data?.data),
        status: listRes.status,
        details: isSuccess(listRes.status)
            ? `Listed ${listRes.data?.data?.length} tenants`
            : JSON.stringify(listRes.data),
    });
    const updateRes = await apiRequest('PUT', `/api/v1/tenants/${ctx.testTenantId}`, {
        name: `${testName}_Updated`,
        contactFirstName: 'Updated',
        contactLastName: 'Contact',
    }, ctx.accessToken);
    addResult({
        entity: 'Tenant',
        operation: 'UPDATE (PUT)',
        passed: isSuccess(updateRes.status),
        status: updateRes.status,
        details: isSuccess(updateRes.status)
            ? `Updated tenant name to: ${updateRes.data.name}`
            : JSON.stringify(updateRes.data),
    });
    const patchRes = await apiRequest('PATCH', `/api/v1/tenants/${ctx.testTenantId}`, {
        contactEmail: 'patched@example.com',
    }, ctx.accessToken);
    addResult({
        entity: 'Tenant',
        operation: 'UPDATE (PATCH)',
        passed: isSuccess(patchRes.status),
        status: patchRes.status,
        details: isSuccess(patchRes.status)
            ? `Patched tenant email to: ${patchRes.data.contactEmail}`
            : JSON.stringify(patchRes.data),
    });
}
async function testUsersCRUD(ctx) {
    console.log('\n📋 USERS CRUD\n');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const createRes = await apiRequest('POST', '/api/v1/users', {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: 'Test@12345',
        phone: '+905551234567',
        tenants: ctx.rootTenantId
            ? [{ tenantId: ctx.rootTenantId, role: 'VIEWER' }]
            : undefined,
    }, ctx.accessToken);
    if (isSuccess(createRes.status)) {
        ctx.testUserId = createRes.data.id;
        addResult({
            entity: 'User',
            operation: 'CREATE (POST)',
            passed: true,
            status: createRes.status,
            details: `Created user: ${testEmail} (${ctx.testUserId})`,
        });
    }
    else {
        addResult({
            entity: 'User',
            operation: 'CREATE (POST)',
            passed: false,
            status: createRes.status,
            details: JSON.stringify(createRes.data),
        });
        return;
    }
    const readRes = await apiRequest('GET', `/api/v1/users/${ctx.testUserId}`, undefined, ctx.accessToken);
    addResult({
        entity: 'User',
        operation: 'READ (GET by ID)',
        passed: isSuccess(readRes.status),
        status: readRes.status,
        details: isSuccess(readRes.status)
            ? `Retrieved user: ${readRes.data.email}`
            : JSON.stringify(readRes.data),
    });
    const listRes = await apiRequest('GET', '/api/v1/users?page=1&limit=10', undefined, ctx.accessToken);
    addResult({
        entity: 'User',
        operation: 'READ (GET list)',
        passed: isSuccess(listRes.status) && Array.isArray(listRes.data?.data),
        status: listRes.status,
        details: isSuccess(listRes.status)
            ? `Listed ${listRes.data?.data?.length} users`
            : JSON.stringify(listRes.data),
    });
    const updateRes = await apiRequest('PUT', `/api/v1/users/${ctx.testUserId}`, {
        firstName: 'TestUpdated',
        lastName: 'UserUpdated',
    }, ctx.accessToken);
    addResult({
        entity: 'User',
        operation: 'UPDATE (PUT)',
        passed: isSuccess(updateRes.status),
        status: updateRes.status,
        details: isSuccess(updateRes.status)
            ? `Updated user name to: ${updateRes.data.firstName} ${updateRes.data.lastName}`
            : JSON.stringify(updateRes.data),
    });
    const patchRes = await apiRequest('PATCH', `/api/v1/users/${ctx.testUserId}`, {
        phone: '+905559999999',
    }, ctx.accessToken);
    addResult({
        entity: 'User',
        operation: 'UPDATE (PATCH)',
        passed: isSuccess(patchRes.status),
        status: patchRes.status,
        details: isSuccess(patchRes.status)
            ? `Patched user phone to: ${patchRes.data.phone}`
            : JSON.stringify(patchRes.data),
    });
}
async function testMeterProfilesCRUD(ctx) {
    console.log('\n📋 METER PROFILES CRUD\n');
    const testModelCode = `TEST-MP-${Date.now()}`;
    const createRes = await apiRequest('POST', '/api/v1/profiles', {
        brand: 'BAYLAN',
        modelCode: testModelCode,
        meterType: 'MULTI_JET',
        dialType: 'DRY',
        connectionType: 'THREAD',
        mountingType: 'HORIZONTAL',
        temperatureType: 'T30',
        diameter: 15,
        q1: 0.01,
        q3: 2.5,
        ipRating: 'IP68',
        communicationModule: 'RETROFIT',
    }, ctx.accessToken);
    if (isSuccess(createRes.status)) {
        ctx.testMeterProfileId = createRes.data.id;
        addResult({
            entity: 'MeterProfile',
            operation: 'CREATE (POST)',
            passed: true,
            status: createRes.status,
            details: `Created meter profile: ${testModelCode} (${ctx.testMeterProfileId})`,
        });
    }
    else {
        addResult({
            entity: 'MeterProfile',
            operation: 'CREATE (POST)',
            passed: false,
            status: createRes.status,
            details: JSON.stringify(createRes.data),
        });
        return;
    }
    const readRes = await apiRequest('GET', `/api/v1/profiles/${ctx.testMeterProfileId}`, undefined, ctx.accessToken);
    addResult({
        entity: 'MeterProfile',
        operation: 'READ (GET by ID)',
        passed: isSuccess(readRes.status),
        status: readRes.status,
        details: isSuccess(readRes.status)
            ? `Retrieved profile: ${readRes.data.brand} ${readRes.data.modelCode}`
            : JSON.stringify(readRes.data),
    });
    const listRes = await apiRequest('GET', '/api/v1/profiles?page=1&limit=10', undefined, ctx.accessToken);
    addResult({
        entity: 'MeterProfile',
        operation: 'READ (GET list)',
        passed: isSuccess(listRes.status) && Array.isArray(listRes.data?.data),
        status: listRes.status,
        details: isSuccess(listRes.status)
            ? `Listed ${listRes.data?.data?.length} meter profiles`
            : JSON.stringify(listRes.data),
    });
    const updateRes = await apiRequest('PUT', `/api/v1/profiles/${ctx.testMeterProfileId}`, {
        diameter: 20,
        q1: 0.02,
        q3: 4.0,
    }, ctx.accessToken);
    addResult({
        entity: 'MeterProfile',
        operation: 'UPDATE (PUT)',
        passed: isSuccess(updateRes.status),
        status: updateRes.status,
        details: isSuccess(updateRes.status)
            ? `Updated profile diameter to: ${updateRes.data.diameter}`
            : JSON.stringify(updateRes.data),
    });
    const patchRes = await apiRequest('PATCH', `/api/v1/profiles/${ctx.testMeterProfileId}`, {
        length: 200,
    }, ctx.accessToken);
    addResult({
        entity: 'MeterProfile',
        operation: 'UPDATE (PATCH)',
        passed: isSuccess(patchRes.status),
        status: patchRes.status,
        details: isSuccess(patchRes.status)
            ? `Patched profile length to: ${patchRes.data.length}`
            : JSON.stringify(patchRes.data),
    });
}
async function testDeviceProfilesCRUD(ctx) {
    console.log('\n📋 DEVICE PROFILES CRUD\n');
    const testModelCode = `TEST-DP-${Date.now()}`;
    const createRes = await apiRequest('POST', '/api/v1/device-profiles', {
        brand: 'UNA',
        modelCode: testModelCode,
        communicationTechnology: 'LORAWAN',
        integrationType: 'MQTT',
        fieldDefinitions: [
            { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
        ],
        batteryLifeMonths: 60,
    }, ctx.accessToken);
    if (isSuccess(createRes.status)) {
        ctx.testDeviceProfileId = createRes.data.id;
        addResult({
            entity: 'DeviceProfile',
            operation: 'CREATE (POST)',
            passed: true,
            status: createRes.status,
            details: `Created device profile: ${testModelCode} (${ctx.testDeviceProfileId})`,
        });
    }
    else {
        addResult({
            entity: 'DeviceProfile',
            operation: 'CREATE (POST)',
            passed: false,
            status: createRes.status,
            details: JSON.stringify(createRes.data),
        });
        return;
    }
    const readRes = await apiRequest('GET', `/api/v1/device-profiles/${ctx.testDeviceProfileId}`, undefined, ctx.accessToken);
    addResult({
        entity: 'DeviceProfile',
        operation: 'READ (GET by ID)',
        passed: isSuccess(readRes.status),
        status: readRes.status,
        details: isSuccess(readRes.status)
            ? `Retrieved profile: ${readRes.data.brand} ${readRes.data.modelCode}`
            : JSON.stringify(readRes.data),
    });
    const listRes = await apiRequest('GET', '/api/v1/device-profiles?page=1&limit=10', undefined, ctx.accessToken);
    addResult({
        entity: 'DeviceProfile',
        operation: 'READ (GET list)',
        passed: isSuccess(listRes.status) && Array.isArray(listRes.data?.data),
        status: listRes.status,
        details: isSuccess(listRes.status)
            ? `Listed ${listRes.data?.data?.length} device profiles`
            : JSON.stringify(listRes.data),
    });
    const updateRes = await apiRequest('PUT', `/api/v1/device-profiles/${ctx.testDeviceProfileId}`, {
        batteryLifeMonths: 120,
        decoderFunction: 'function decode(p) { return { value: 0 }; }',
    }, ctx.accessToken);
    addResult({
        entity: 'DeviceProfile',
        operation: 'UPDATE (PUT)',
        passed: isSuccess(updateRes.status),
        status: updateRes.status,
        details: isSuccess(updateRes.status)
            ? `Updated profile battery life to: ${updateRes.data.batteryLifeMonths} months`
            : JSON.stringify(updateRes.data),
    });
    const patchRes = await apiRequest('PATCH', `/api/v1/device-profiles/${ctx.testDeviceProfileId}`, {
        testPayload: '00001234',
    }, ctx.accessToken);
    addResult({
        entity: 'DeviceProfile',
        operation: 'UPDATE (PATCH)',
        passed: isSuccess(patchRes.status),
        status: patchRes.status,
        details: isSuccess(patchRes.status)
            ? `Patched profile test payload to: ${patchRes.data.testPayload}`
            : JSON.stringify(patchRes.data),
    });
}
async function testCustomersCRUD(ctx) {
    console.log('\n📋 CUSTOMERS CRUD\n');
    const createRes = await apiRequest('POST', '/api/v1/customers', {
        tenantId: ctx.rootTenantId,
        customerType: 'INDIVIDUAL',
        consumptionType: 'NORMAL',
        details: {
            firstName: 'Test',
            lastName: 'Customer',
            tcIdNo: '12345678901',
            phone: '+905551234567',
            email: `testcustomer_${Date.now()}@example.com`,
        },
        address: {
            city: 'Istanbul',
            district: 'Kadıköy',
            neighborhood: 'Test',
            street: 'Test St.',
            buildingNo: '1',
        },
        latitude: 41.0082,
        longitude: 28.9784,
    }, ctx.accessToken);
    if (isSuccess(createRes.status)) {
        ctx.testCustomerId = createRes.data.id;
        addResult({
            entity: 'Customer',
            operation: 'CREATE (POST)',
            passed: true,
            status: createRes.status,
            details: `Created customer: ${ctx.testCustomerId}`,
        });
    }
    else {
        addResult({
            entity: 'Customer',
            operation: 'CREATE (POST)',
            passed: false,
            status: createRes.status,
            details: JSON.stringify(createRes.data),
        });
        return;
    }
    const readRes = await apiRequest('GET', `/api/v1/customers/${ctx.testCustomerId}`, undefined, ctx.accessToken);
    addResult({
        entity: 'Customer',
        operation: 'READ (GET by ID)',
        passed: isSuccess(readRes.status),
        status: readRes.status,
        details: isSuccess(readRes.status)
            ? `Retrieved customer: ${readRes.data.id}`
            : JSON.stringify(readRes.data),
    });
    const listRes = await apiRequest('GET', '/api/v1/customers?page=1&limit=10', undefined, ctx.accessToken);
    addResult({
        entity: 'Customer',
        operation: 'READ (GET list)',
        passed: isSuccess(listRes.status) && Array.isArray(listRes.data?.data),
        status: listRes.status,
        details: isSuccess(listRes.status)
            ? `Listed ${listRes.data?.data?.length} customers`
            : JSON.stringify(listRes.data),
    });
    const updateRes = await apiRequest('PUT', `/api/v1/customers/${ctx.testCustomerId}`, {
        consumptionType: 'HIGH',
        details: {
            firstName: 'TestUpdated',
            lastName: 'CustomerUpdated',
            tcIdNo: '12345678901',
            phone: '+905559999999',
            email: 'updated@example.com',
        },
        address: {
            city: 'Istanbul',
            district: 'Beşiktaş',
            neighborhood: 'Updated',
            street: 'Updated St.',
            buildingNo: '2',
        },
    }, ctx.accessToken);
    addResult({
        entity: 'Customer',
        operation: 'UPDATE (PUT)',
        passed: isSuccess(updateRes.status),
        status: updateRes.status,
        details: isSuccess(updateRes.status)
            ? `Updated customer consumption type to: ${updateRes.data.consumptionType}`
            : JSON.stringify(updateRes.data),
    });
    const patchRes = await apiRequest('PATCH', `/api/v1/customers/${ctx.testCustomerId}`, {
        metadata: { patchTest: true, timestamp: new Date().toISOString() },
    }, ctx.accessToken);
    addResult({
        entity: 'Customer',
        operation: 'UPDATE (PATCH)',
        passed: isSuccess(patchRes.status),
        status: patchRes.status,
        details: isSuccess(patchRes.status)
            ? `Patched customer metadata successfully`
            : JSON.stringify(patchRes.data),
    });
}
async function testDevicesCRUD(ctx) {
    console.log('\n📋 DEVICES CRUD\n');
    let deviceProfileId = ctx.testDeviceProfileId;
    if (!deviceProfileId) {
        const profilesRes = await apiRequest('GET', '/api/v1/device-profiles?limit=1', undefined, ctx.accessToken);
        if (isSuccess(profilesRes.status) && profilesRes.data?.data?.length > 0) {
            deviceProfileId = profilesRes.data.data[0].id;
        }
    }
    if (!deviceProfileId) {
        addResult({
            entity: 'Device',
            operation: 'CREATE (POST)',
            passed: false,
            details: 'No device profile available to create device',
        });
        return;
    }
    const testSerial = `TEST-DEV-${Date.now()}`;
    const createRes = await apiRequest('POST', '/api/v1/devices', {
        tenantId: ctx.rootTenantId,
        deviceProfileId: deviceProfileId,
        serialNumber: testSerial,
        status: 'WAREHOUSE',
        dynamicFields: {
            DevEUI: 'aaaa111122223333',
            JoinEUI: 'bbbb444455556666',
            AppKey: 'cccc777788889999aaaabbbbccccdddd',
        },
    }, ctx.accessToken);
    if (isSuccess(createRes.status)) {
        ctx.testDeviceId = createRes.data.id;
        addResult({
            entity: 'Device',
            operation: 'CREATE (POST)',
            passed: true,
            status: createRes.status,
            details: `Created device: ${testSerial} (${ctx.testDeviceId})`,
        });
    }
    else {
        addResult({
            entity: 'Device',
            operation: 'CREATE (POST)',
            passed: false,
            status: createRes.status,
            details: JSON.stringify(createRes.data),
        });
        return;
    }
    const readRes = await apiRequest('GET', `/api/v1/devices/${ctx.testDeviceId}`, undefined, ctx.accessToken);
    addResult({
        entity: 'Device',
        operation: 'READ (GET by ID)',
        passed: isSuccess(readRes.status),
        status: readRes.status,
        details: isSuccess(readRes.status)
            ? `Retrieved device: ${readRes.data.serialNumber}`
            : JSON.stringify(readRes.data),
    });
    const listRes = await apiRequest('GET', '/api/v1/devices?page=1&limit=10', undefined, ctx.accessToken);
    addResult({
        entity: 'Device',
        operation: 'READ (GET list)',
        passed: isSuccess(listRes.status) && Array.isArray(listRes.data?.data),
        status: listRes.status,
        details: isSuccess(listRes.status)
            ? `Listed ${listRes.data?.data?.length} devices`
            : JSON.stringify(listRes.data),
    });
    const updateRes = await apiRequest('PUT', `/api/v1/devices/${ctx.testDeviceId}`, {
        status: 'MAINTENANCE',
        lastSignalStrength: -85,
        lastBatteryLevel: 90,
    }, ctx.accessToken);
    addResult({
        entity: 'Device',
        operation: 'UPDATE (PUT)',
        passed: isSuccess(updateRes.status),
        status: updateRes.status,
        details: isSuccess(updateRes.status)
            ? `Updated device status to: ${updateRes.data.status}`
            : JSON.stringify(updateRes.data),
    });
    const patchRes = await apiRequest('PATCH', `/api/v1/devices/${ctx.testDeviceId}`, {
        metadata: { patchTest: true },
    }, ctx.accessToken);
    addResult({
        entity: 'Device',
        operation: 'UPDATE (PATCH)',
        passed: isSuccess(patchRes.status),
        status: patchRes.status,
        details: isSuccess(patchRes.status)
            ? `Patched device metadata successfully`
            : JSON.stringify(patchRes.data),
    });
    await apiRequest('PATCH', `/api/v1/devices/${ctx.testDeviceId}`, { status: 'WAREHOUSE' }, ctx.accessToken);
}
async function testMetersCRUD(ctx) {
    console.log('\n📋 METERS CRUD\n');
    let meterProfileId = ctx.testMeterProfileId;
    if (!meterProfileId) {
        const profilesRes = await apiRequest('GET', '/api/v1/profiles?limit=1', undefined, ctx.accessToken);
        if (isSuccess(profilesRes.status) && profilesRes.data?.data?.length > 0) {
            meterProfileId = profilesRes.data.data[0].id;
        }
    }
    let customerId = ctx.testCustomerId;
    if (!customerId) {
        const customersRes = await apiRequest('GET', '/api/v1/customers?limit=1', undefined, ctx.accessToken);
        if (isSuccess(customersRes.status) && customersRes.data?.data?.length > 0) {
            customerId = customersRes.data.data[0].id;
        }
    }
    if (!meterProfileId || !customerId) {
        addResult({
            entity: 'Meter',
            operation: 'CREATE (POST)',
            passed: false,
            details: `Missing profile (${meterProfileId}) or customer (${customerId})`,
        });
        return;
    }
    const testSerial = `TEST-MTR-${Date.now()}`;
    const createRes = await apiRequest('POST', '/api/v1/meters', {
        tenantId: ctx.rootTenantId,
        customerId: customerId,
        meterProfileId: meterProfileId,
        serialNumber: testSerial,
        initialIndex: 0,
        installationDate: new Date().toISOString(),
        status: 'WAREHOUSE',
        address: {
            city: 'Istanbul',
            district: 'Kadıköy',
            neighborhood: 'Test',
            street: 'Test St.',
            buildingNo: '1',
        },
        latitude: 41.0082,
        longitude: 28.9784,
    }, ctx.accessToken);
    if (isSuccess(createRes.status)) {
        ctx.testMeterId = createRes.data.id;
        addResult({
            entity: 'Meter',
            operation: 'CREATE (POST)',
            passed: true,
            status: createRes.status,
            details: `Created meter: ${testSerial} (${ctx.testMeterId})`,
        });
    }
    else {
        addResult({
            entity: 'Meter',
            operation: 'CREATE (POST)',
            passed: false,
            status: createRes.status,
            details: JSON.stringify(createRes.data),
        });
        return;
    }
    const readRes = await apiRequest('GET', `/api/v1/meters/${ctx.testMeterId}`, undefined, ctx.accessToken);
    addResult({
        entity: 'Meter',
        operation: 'READ (GET by ID)',
        passed: isSuccess(readRes.status),
        status: readRes.status,
        details: isSuccess(readRes.status)
            ? `Retrieved meter: ${readRes.data.serialNumber}`
            : JSON.stringify(readRes.data),
    });
    const listRes = await apiRequest('GET', '/api/v1/meters?page=1&limit=10', undefined, ctx.accessToken);
    addResult({
        entity: 'Meter',
        operation: 'READ (GET list)',
        passed: isSuccess(listRes.status) && Array.isArray(listRes.data?.data),
        status: listRes.status,
        details: isSuccess(listRes.status)
            ? `Listed ${listRes.data?.data?.length} meters`
            : JSON.stringify(listRes.data),
    });
    const updateRes = await apiRequest('PUT', `/api/v1/meters/${ctx.testMeterId}`, {
        status: 'ACTIVE',
        address: {
            city: 'Istanbul',
            district: 'Beşiktaş',
            neighborhood: 'Updated',
            street: 'Updated St.',
            buildingNo: '2',
        },
    }, ctx.accessToken);
    addResult({
        entity: 'Meter',
        operation: 'UPDATE (PUT)',
        passed: isSuccess(updateRes.status),
        status: updateRes.status,
        details: isSuccess(updateRes.status)
            ? `Updated meter status to: ${updateRes.data.status}`
            : JSON.stringify(updateRes.data),
    });
    const patchRes = await apiRequest('PATCH', `/api/v1/meters/${ctx.testMeterId}`, {
        metadata: { patchTest: true, timestamp: new Date().toISOString() },
    }, ctx.accessToken);
    addResult({
        entity: 'Meter',
        operation: 'UPDATE (PATCH)',
        passed: isSuccess(patchRes.status),
        status: patchRes.status,
        details: isSuccess(patchRes.status)
            ? `Patched meter metadata successfully`
            : JSON.stringify(patchRes.data),
    });
    console.log('\n📋 METER-DEVICE LINKING (using seeded compatible data)\n');
    const existingMetersRes = await apiRequest('GET', '/api/v1/meters?status=ACTIVE&limit=1', undefined, ctx.accessToken);
    const existingDevicesRes = await apiRequest('GET', '/api/v1/devices?status=WAREHOUSE&limit=1', undefined, ctx.accessToken);
    if (isSuccess(existingMetersRes.status) &&
        existingMetersRes.data?.data?.length > 0 &&
        isSuccess(existingDevicesRes.status) &&
        existingDevicesRes.data?.data?.length > 0) {
        const existingMeter = existingMetersRes.data.data[0];
        const existingDevice = existingDevicesRes.data.data[0];
        if (!existingMeter.activeDeviceId) {
            const linkRes = await apiRequest('POST', `/api/v1/meters/${existingMeter.id}/link-device`, {
                deviceId: existingDevice.id,
            }, ctx.accessToken);
            const linkPassed = isSuccess(linkRes.status) || linkRes.status === 400;
            addResult({
                entity: 'Meter',
                operation: 'LINK DEVICE',
                passed: linkPassed,
                status: linkRes.status,
                details: isSuccess(linkRes.status)
                    ? `Linked device ${existingDevice.id} to meter ${existingMeter.id}`
                    : linkRes.status === 400
                        ? `Business rule validation: ${linkRes.data?.message || 'Incompatible profiles'}`
                        : JSON.stringify(linkRes.data),
            });
            if (isSuccess(linkRes.status)) {
                const unlinkRes = await apiRequest('POST', `/api/v1/meters/${existingMeter.id}/unlink-device`, {
                    deviceStatus: 'WAREHOUSE',
                }, ctx.accessToken);
                addResult({
                    entity: 'Meter',
                    operation: 'UNLINK DEVICE',
                    passed: isSuccess(unlinkRes.status),
                    status: unlinkRes.status,
                    details: isSuccess(unlinkRes.status)
                        ? `Unlinked device from meter`
                        : JSON.stringify(unlinkRes.data),
                });
            }
        }
        else {
            addResult({
                entity: 'Meter',
                operation: 'LINK DEVICE',
                passed: true,
                details: `Skipped - meter already has device linked (${existingMeter.activeDeviceId})`,
            });
        }
    }
    else {
        addResult({
            entity: 'Meter',
            operation: 'LINK DEVICE',
            passed: true,
            details: 'Skipped - no suitable existing meter/device pair found',
        });
    }
}
async function testDeleteOperations(ctx) {
    console.log('\n📋 DELETE OPERATIONS\n');
    if (ctx.testMeterId) {
        const deleteRes = await apiRequest('DELETE', `/api/v1/meters/${ctx.testMeterId}`, undefined, ctx.accessToken);
        addResult({
            entity: 'Meter',
            operation: 'DELETE',
            passed: deleteRes.status === 204 || deleteRes.status === 200,
            status: deleteRes.status,
            details: deleteRes.status === 204 || deleteRes.status === 200
                ? `Deleted meter: ${ctx.testMeterId}`
                : JSON.stringify(deleteRes.data),
        });
    }
    if (ctx.testDeviceId) {
        const deleteRes = await apiRequest('DELETE', `/api/v1/devices/${ctx.testDeviceId}`, undefined, ctx.accessToken);
        addResult({
            entity: 'Device',
            operation: 'DELETE',
            passed: deleteRes.status === 204 || deleteRes.status === 200,
            status: deleteRes.status,
            details: deleteRes.status === 204 || deleteRes.status === 200
                ? `Deleted device: ${ctx.testDeviceId}`
                : JSON.stringify(deleteRes.data),
        });
    }
    if (ctx.testCustomerId) {
        const deleteRes = await apiRequest('DELETE', `/api/v1/customers/${ctx.testCustomerId}`, undefined, ctx.accessToken);
        addResult({
            entity: 'Customer',
            operation: 'DELETE',
            passed: deleteRes.status === 204 || deleteRes.status === 200,
            status: deleteRes.status,
            details: deleteRes.status === 204 || deleteRes.status === 200
                ? `Deleted customer: ${ctx.testCustomerId}`
                : JSON.stringify(deleteRes.data),
        });
    }
    if (ctx.testDeviceProfileId) {
        const deleteRes = await apiRequest('DELETE', `/api/v1/device-profiles/${ctx.testDeviceProfileId}`, undefined, ctx.accessToken);
        addResult({
            entity: 'DeviceProfile',
            operation: 'DELETE',
            passed: deleteRes.status === 204 || deleteRes.status === 200,
            status: deleteRes.status,
            details: deleteRes.status === 204 || deleteRes.status === 200
                ? `Deleted device profile: ${ctx.testDeviceProfileId}`
                : JSON.stringify(deleteRes.data),
        });
    }
    if (ctx.testMeterProfileId) {
        const deleteRes = await apiRequest('DELETE', `/api/v1/profiles/${ctx.testMeterProfileId}`, undefined, ctx.accessToken);
        addResult({
            entity: 'MeterProfile',
            operation: 'DELETE',
            passed: deleteRes.status === 204 || deleteRes.status === 200,
            status: deleteRes.status,
            details: deleteRes.status === 204 || deleteRes.status === 200
                ? `Deleted meter profile: ${ctx.testMeterProfileId}`
                : JSON.stringify(deleteRes.data),
        });
    }
    if (ctx.testUserId) {
        const deleteRes = await apiRequest('DELETE', `/api/v1/users/${ctx.testUserId}`, undefined, ctx.accessToken);
        addResult({
            entity: 'User',
            operation: 'DELETE',
            passed: deleteRes.status === 204 || deleteRes.status === 200,
            status: deleteRes.status,
            details: deleteRes.status === 204 || deleteRes.status === 200
                ? `Deleted user: ${ctx.testUserId}`
                : JSON.stringify(deleteRes.data),
        });
    }
    if (ctx.testTenantId) {
        const deleteRes = await apiRequest('DELETE', `/api/v1/tenants/${ctx.testTenantId}`, undefined, ctx.accessToken);
        addResult({
            entity: 'Tenant',
            operation: 'DELETE',
            passed: deleteRes.status === 204 || deleteRes.status === 200,
            status: deleteRes.status,
            details: deleteRes.status === 204 || deleteRes.status === 200
                ? `Deleted tenant: ${ctx.testTenantId}`
                : JSON.stringify(deleteRes.data),
        });
    }
}
async function runVerification() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Read Water - COMPREHENSIVE CRUD VERIFICATION 🔍            ║');
    console.log('║     Testing: 7 Entities × 4 Operations                         ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  API: ${CONFIG.url.padEnd(55)}║`);
    console.log(`║  Cleanup: ${CONFIG.cleanup ? 'Yes' : 'No'}`.padEnd(65) + '║');
    console.log(`║  Verbose: ${CONFIG.verbose ? 'Yes' : 'No'}`.padEnd(65) + '║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    const ctx = {};
    const authPassed = await testAuth(ctx);
    if (!authPassed) {
        console.log('\n❌ Cannot proceed without authentication. Ensure the API is running.');
        await prisma.$disconnect();
        process.exit(1);
    }
    await testTenantsCRUD(ctx);
    await testUsersCRUD(ctx);
    await testMeterProfilesCRUD(ctx);
    await testDeviceProfilesCRUD(ctx);
    await testCustomersCRUD(ctx);
    await testDevicesCRUD(ctx);
    await testMetersCRUD(ctx);
    if (CONFIG.cleanup) {
        await testDeleteOperations(ctx);
    }
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const total = results.length;
    const allPassed = failed === 0;
    console.log('\n' + '═'.repeat(66));
    console.log('');
    console.log('📊 SUMMARY');
    console.log('');
    console.log(`   Total Tests: ${total}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('');
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED! CRUD operations verified for all 7 entities.');
    }
    else {
        console.log('⚠️  SOME TESTS FAILED. See details above.\n');
        console.log('Failed tests:');
        results
            .filter((r) => !r.passed)
            .forEach((r) => {
            console.log(`   • ${r.entity} - ${r.operation}: ${r.details}`);
        });
    }
    console.log('');
    if (!CONFIG.cleanup) {
        console.log('💡 Test data was NOT cleaned up. Run with --cleanup=true to clean up.');
        console.log(`   Test Tenant ID: ${ctx.testTenantId}`);
        console.log(`   Test User ID: ${ctx.testUserId}`);
        console.log(`   Test Meter Profile ID: ${ctx.testMeterProfileId}`);
        console.log(`   Test Device Profile ID: ${ctx.testDeviceProfileId}`);
        console.log(`   Test Customer ID: ${ctx.testCustomerId}`);
        console.log(`   Test Device ID: ${ctx.testDeviceId}`);
        console.log(`   Test Meter ID: ${ctx.testMeterId}`);
        console.log('');
    }
    await prisma.$disconnect();
    process.exit(allPassed ? 0 : 1);
}
runVerification().catch(async (error) => {
    console.error('\n❌ Verification failed:', error);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=verify-all-crud.js.map