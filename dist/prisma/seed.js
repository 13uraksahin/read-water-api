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
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient({
    log: ['warn', 'error'],
});
const BATCH_SIZE = 100;
const PASSWORD = 'Asdf1234.';
const SALT_ROUNDS = 10;
const HATSU_BASE_LAT = 36.2025;
const HATSU_BASE_LNG = 36.1601;
const ASKI_BASE_LAT = 39.9334;
const ASKI_BASE_LNG = 32.8597;
function randomCoordinate(baseLat, baseLng, radiusKm = 10) {
    const radiusDeg = radiusKm / 111;
    const lat = baseLat + (Math.random() - 0.5) * 2 * radiusDeg;
    const lng = baseLng + (Math.random() - 0.5) * 2 * radiusDeg;
    return { lat: parseFloat(lat.toFixed(8)), lng: parseFloat(lng.toFixed(8)) };
}
function randomHex(length) {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}
function generateSerial(prefix, index) {
    return `${prefix}-${String(index).padStart(6, '0')}`;
}
async function processBatch(items, batchSize, processor, label) {
    const totalBatches = Math.ceil(items.length / batchSize);
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        process.stdout.write(`\r   Processing ${label}: Batch ${batchNum}/${totalBatches} (${Math.min(i + batchSize, items.length)}/${items.length})`);
        await processor(batch);
    }
    console.log(` ✓`);
}
async function teardown() {
    console.log('\n🧹 PART A: TEARDOWN - Cleaning existing data...\n');
    const teardownSteps = [
        { name: 'Readings', action: async () => { await prisma.$executeRawUnsafe('TRUNCATE TABLE "readings" CASCADE;'); } },
        { name: 'Alarms', action: async () => { await prisma.alarm.deleteMany(); } },
        { name: 'ActivityLogs', action: async () => { await prisma.activityLog.deleteMany(); } },
        { name: 'Meters', action: async () => { await prisma.meter.deleteMany(); } },
        { name: 'Devices', action: async () => { await prisma.device.deleteMany(); } },
        { name: 'Subscriptions', action: async () => { await prisma.subscription.deleteMany(); } },
        { name: 'Customers', action: async () => { await prisma.customer.deleteMany(); } },
        { name: 'RefreshTokens', action: async () => { await prisma.refreshToken.deleteMany(); } },
        { name: 'UserTenants', action: async () => { await prisma.userTenant.deleteMany(); } },
        { name: 'Users', action: async () => { await prisma.user.deleteMany(); } },
        { name: 'Settings', action: async () => { await prisma.setting.deleteMany(); } },
        { name: 'MeterProfiles (disconnect relations)', action: async () => {
                await prisma.$executeRawUnsafe('DELETE FROM "_TenantAllowedProfiles";');
                await prisma.$executeRawUnsafe('DELETE FROM "_CompatibleDeviceProfiles";');
            } },
        { name: 'MeterProfiles', action: async () => { await prisma.meterProfile.deleteMany(); } },
        { name: 'DeviceProfiles', action: async () => { await prisma.deviceProfile.deleteMany(); } },
        { name: 'CommunicationTechFieldDefs', action: async () => { await prisma.communicationTechFieldDef.deleteMany(); } },
        { name: 'Tenants', action: async () => { await prisma.tenant.deleteMany(); } },
    ];
    for (const step of teardownSteps) {
        try {
            await step.action();
            console.log(`   ✓ Cleaned: ${step.name}`);
        }
        catch (error) {
            console.log(`   ⚠ Warning cleaning ${step.name}:`, error.message);
        }
    }
    console.log('\n   ✓ Teardown complete!\n');
}
async function createTenants() {
    console.log('🏢 Creating Tenants...');
    const tenants = [
        {
            path: 'root',
            name: 'Read Water Platform',
            contactFirstName: 'System',
            contactLastName: 'Administrator',
            contactEmail: 'admin@readwater.io',
            tenantSubscriptionStatus: client_1.TenantSubscriptionStatus.ACTIVE,
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
            tenantSubscriptionStatus: client_1.TenantSubscriptionStatus.ACTIVE,
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
            tenantSubscriptionStatus: client_1.TenantSubscriptionStatus.ACTIVE,
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
    const createdTenants = {};
    for (const tenant of tenants) {
        const created = await prisma.tenant.create({
            data: {
                path: tenant.path,
                name: tenant.name,
                contactFirstName: tenant.contactFirstName,
                contactLastName: tenant.contactLastName,
                contactEmail: tenant.contactEmail,
                contactPhone: tenant.contactPhone,
                tenantSubscriptionStatus: tenant.tenantSubscriptionStatus,
                subscriptionPlan: tenant.subscriptionPlan,
                latitude: tenant.latitude,
                longitude: tenant.longitude,
                address: tenant.address,
            },
        });
        createdTenants[tenant.path] = created.id;
        console.log(`   ✓ ${tenant.name} (${tenant.path})`);
    }
    const rootId = createdTenants['root'];
    await prisma.tenant.update({ where: { id: createdTenants['root.aski'] }, data: { parentId: rootId } });
    await prisma.tenant.update({ where: { id: createdTenants['root.hatsu'] }, data: { parentId: rootId } });
    return createdTenants;
}
async function createUsers(tenants) {
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
            role: client_1.SystemRole.PLATFORM_ADMIN,
        },
        {
            firstName: 'ASKİ',
            lastName: 'Yetkili',
            email: 'aski.yetkili@example.com',
            phone: '+908887776655',
            tcIdNo: '12345678902',
            tenantPath: 'root.aski',
            role: client_1.SystemRole.TENANT_ADMIN,
        },
        {
            firstName: 'HATSU',
            lastName: 'Yetkili',
            email: 'hatsu.yetkili@example.com',
            phone: '+907776665544',
            tcIdNo: '12345678903',
            tenantPath: 'root.hatsu',
            role: client_1.SystemRole.TENANT_ADMIN,
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
async function createCommunicationTechDefs() {
    console.log('\n📡 Creating Communication Technology Field Definitions...');
    const techDefs = [
        {
            technology: client_1.CommunicationTechnology.LORAWAN,
            integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
            fields: [
                { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
            ],
        },
        {
            technology: client_1.CommunicationTechnology.SIGFOX,
            integrationTypes: [client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
            fields: [
                { name: 'ID', type: 'hex', length: 8, regex: '^[a-fA-F0-9]{8}$', required: true },
                { name: 'PAC', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
            ],
        },
        {
            technology: client_1.CommunicationTechnology.NB_IOT,
            integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
async function createMeterProfiles(tenants) {
    console.log('\n📊 Creating Meter Profiles (10 Total)...');
    const hatsuId = tenants['root.hatsu'];
    const askiId = tenants['root.aski'];
    const meterProfilesData = [
        {
            brand: client_1.Brand.MANAS,
            modelCode: 'MNS-A-DN15',
            meterType: client_1.MeterType.MULTI_JET,
            dialType: client_1.DialType.DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.HORIZONTAL,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 15,
            q3: 2.5,
            ipRating: client_1.IPRating.IP68,
            communicationModule: client_1.CommunicationModule.RETROFIT,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.MANAS,
            modelCode: 'MNS-B-DN20',
            meterType: client_1.MeterType.ULTRASONIC,
            dialType: client_1.DialType.DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.BOTH,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 20,
            q3: 4.0,
            ipRating: client_1.IPRating.IP68,
            communicationModule: client_1.CommunicationModule.INTEGRATED,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.ITRON,
            modelCode: 'ITR-A-DN15',
            meterType: client_1.MeterType.SINGLE_JET,
            dialType: client_1.DialType.SUPER_DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.HORIZONTAL,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 15,
            q3: 2.5,
            ipRating: client_1.IPRating.IP68,
            communicationModule: client_1.CommunicationModule.RETROFIT,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.ITRON,
            modelCode: 'ITR-B-DN20',
            meterType: client_1.MeterType.MULTI_JET,
            dialType: client_1.DialType.DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.BOTH,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 20,
            q3: 4.0,
            ipRating: client_1.IPRating.IP68,
            communicationModule: client_1.CommunicationModule.RETROFIT,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.BAYLAN,
            modelCode: 'BYL-A-DN15',
            meterType: client_1.MeterType.MULTI_JET,
            dialType: client_1.DialType.DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.HORIZONTAL,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 15,
            q3: 2.5,
            ipRating: client_1.IPRating.IP68,
            communicationModule: client_1.CommunicationModule.RETROFIT,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.BAYLAN,
            modelCode: 'BYL-B-DN20',
            meterType: client_1.MeterType.MULTI_JET,
            dialType: client_1.DialType.SUPER_DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.BOTH,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 20,
            q3: 4.0,
            ipRating: client_1.IPRating.IP68,
            communicationModule: client_1.CommunicationModule.RETROFIT,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.ZENNER,
            modelCode: 'ZEN-A-DN15',
            meterType: client_1.MeterType.MULTI_JET,
            dialType: client_1.DialType.SUPER_DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.HORIZONTAL,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 15,
            q3: 2.5,
            ipRating: client_1.IPRating.IP68,
            communicationModule: client_1.CommunicationModule.INTEGRATED,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.ZENNER,
            modelCode: 'ZEN-B-DN20',
            meterType: client_1.MeterType.ULTRASONIC,
            dialType: client_1.DialType.DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.BOTH,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 20,
            q3: 4.0,
            ipRating: client_1.IPRating.IP68,
            communicationModule: client_1.CommunicationModule.INTEGRATED,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.CEM,
            modelCode: 'CEM-A-DN15',
            meterType: client_1.MeterType.SINGLE_JET,
            dialType: client_1.DialType.DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.HORIZONTAL,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 15,
            q3: 2.5,
            ipRating: client_1.IPRating.IP67,
            communicationModule: client_1.CommunicationModule.RETROFIT,
            allowedTenants: [hatsuId, askiId],
        },
        {
            brand: client_1.Brand.KLEPSAN,
            modelCode: 'KLP-A-DN15',
            meterType: client_1.MeterType.MULTI_JET,
            dialType: client_1.DialType.DRY,
            connectionType: client_1.ConnectionType.THREAD,
            mountingType: client_1.MountingType.HORIZONTAL,
            temperatureType: client_1.TemperatureType.T30,
            diameter: 15,
            q3: 2.5,
            ipRating: client_1.IPRating.IP67,
            communicationModule: client_1.CommunicationModule.RETROFIT,
            allowedTenants: [hatsuId],
        },
    ];
    const meterProfiles = [];
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
async function createDeviceProfiles(meterProfiles) {
    console.log('\n📱 Creating Device Profiles (7 Total)...');
    const deviceProfilesData = [
        {
            brand: client_1.DeviceBrand.MANAS,
            modelCode: 'MNS-DEV-LW01',
            communicationTechnology: client_1.CommunicationTechnology.LORAWAN,
            integrationType: client_1.IntegrationType.MQTT,
            fieldDefinitions: [
                { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
            ],
            decoderFunction: 'function decode(payload) { return { value: parseInt(payload, 16) / 1000 }; }',
            batteryLifeMonths: 120,
            compatibleMeterProfiles: [meterProfiles[0], meterProfiles[1], meterProfiles[2], meterProfiles[3]],
        },
        {
            brand: client_1.DeviceBrand.ITRON,
            modelCode: 'ITR-DEV-NB01',
            communicationTechnology: client_1.CommunicationTechnology.NB_IOT,
            integrationType: client_1.IntegrationType.HTTP,
            fieldDefinitions: [
                { name: 'IMEI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: true },
                { name: 'IMSI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: false },
            ],
            decoderFunction: 'function decode(payload) { const d = JSON.parse(payload); return { value: d.reading / 1000 }; }',
            batteryLifeMonths: 84,
            compatibleMeterProfiles: [meterProfiles[0], meterProfiles[1], meterProfiles[2], meterProfiles[3]],
        },
        {
            brand: client_1.DeviceBrand.BAYLAN,
            modelCode: 'BYL-DEV-LW01',
            communicationTechnology: client_1.CommunicationTechnology.LORAWAN,
            integrationType: client_1.IntegrationType.MQTT,
            fieldDefinitions: [
                { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
            ],
            decoderFunction: 'function decode(payload) { return { value: parseInt(payload.slice(0,8), 16) / 1000 }; }',
            batteryLifeMonths: 96,
            compatibleMeterProfiles: [meterProfiles[4], meterProfiles[5]],
        },
        {
            brand: client_1.DeviceBrand.CEM,
            modelCode: 'CEM-DEV-SF01',
            communicationTechnology: client_1.CommunicationTechnology.SIGFOX,
            integrationType: client_1.IntegrationType.HTTP,
            fieldDefinitions: [
                { name: 'ID', type: 'hex', length: 8, regex: '^[a-fA-F0-9]{8}$', required: true },
                { name: 'PAC', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
            ],
            decoderFunction: 'function decode(payload) { return { value: parseInt(payload, 16) / 1000 }; }',
            batteryLifeMonths: 60,
            compatibleMeterProfiles: [meterProfiles[8]],
        },
        {
            brand: client_1.DeviceBrand.KLEPSAN,
            modelCode: 'KLP-DEV-LW01',
            communicationTechnology: client_1.CommunicationTechnology.LORAWAN,
            integrationType: client_1.IntegrationType.MQTT,
            fieldDefinitions: [
                { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
            ],
            decoderFunction: 'function decode(payload) { return { value: parseInt(payload, 16) / 1000 }; }',
            batteryLifeMonths: 72,
            compatibleMeterProfiles: [meterProfiles[9]],
        },
        {
            brand: client_1.DeviceBrand.IMA,
            modelCode: 'IMA-DEV-LW01',
            communicationTechnology: client_1.CommunicationTechnology.LORAWAN,
            integrationType: client_1.IntegrationType.MQTT,
            fieldDefinitions: [
                { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
                { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
            ],
            decoderFunction: 'function decode(payload) { return { value: parseInt(payload, 16) / 1000 }; }',
            batteryLifeMonths: 120,
            compatibleMeterProfiles: meterProfiles,
        },
        {
            brand: client_1.DeviceBrand.INODYA,
            modelCode: 'IND-DEV-NB01',
            communicationTechnology: client_1.CommunicationTechnology.NB_IOT,
            integrationType: client_1.IntegrationType.HTTP,
            fieldDefinitions: [
                { name: 'IMEI', type: 'string', length: 15, regex: '^[0-9]{15}$', required: true },
            ],
            decoderFunction: 'function decode(payload) { const d = JSON.parse(payload); return { value: d.val / 1000 }; }',
            batteryLifeMonths: 96,
            compatibleMeterProfiles: [meterProfiles[0], meterProfiles[1], meterProfiles[2], meterProfiles[3]],
        },
    ];
    const deviceProfiles = [];
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
async function createBulkAssets(tenants, meterProfiles, deviceProfiles) {
    console.log('\n📦 Creating Bulk Assets (with Subscription Model)...\n');
    const batches = [
        { count: 50, meterProfileIdx: 2, deviceProfileIdx: 1, tenantPath: 'root.hatsu', serialPrefix: 'HATSU-A' },
        { count: 100, meterProfileIdx: 0, deviceProfileIdx: 1, tenantPath: 'root.aski', serialPrefix: 'ASKI-A' },
    ];
    let globalDeviceCounter = 0;
    let globalMeterCounter = 0;
    let globalCustomerCounter = 0;
    let globalSubscriptionCounter = 0;
    for (const batch of batches) {
        const tenantId = tenants[batch.tenantPath];
        const meterProfileId = meterProfiles[batch.meterProfileIdx];
        const deviceProfileId = deviceProfiles[batch.deviceProfileIdx];
        const isHatsu = batch.tenantPath === 'root.hatsu';
        const baseLat = isHatsu ? HATSU_BASE_LAT : ASKI_BASE_LAT;
        const baseLng = isHatsu ? HATSU_BASE_LNG : ASKI_BASE_LNG;
        const city = isHatsu ? 'Hatay' : 'Ankara';
        console.log(`\n   📍 ${batch.serialPrefix}: ${batch.count} units`);
        const items = [];
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
        await processBatch(items, BATCH_SIZE, async (batchItems) => {
            await prisma.$transaction(async (tx) => {
                await tx.device.createMany({
                    data: batchItems.map(item => ({
                        serialNumber: item.deviceSerial,
                        tenantId,
                        deviceProfileId,
                        status: client_1.DeviceStatus.ACTIVE,
                        dynamicFields: item.dynamicFields,
                    })),
                });
                const devices = await tx.device.findMany({
                    where: { serialNumber: { in: batchItems.map(i => i.deviceSerial) } },
                    select: { id: true, serialNumber: true },
                });
                const deviceMap = new Map(devices.map(d => [d.serialNumber, d.id]));
                await tx.customer.createMany({
                    data: batchItems.map((item, idx) => ({
                        tenantId,
                        customerNumber: `C-${batch.serialPrefix}-${String(globalCustomerCounter - batchItems.length + idx + 1).padStart(4, '0')}`,
                        customerType: client_1.CustomerType.INDIVIDUAL,
                        details: {
                            firstName: item.customerName,
                            lastName: 'Auto',
                            tcIdNo: randomHex(11),
                            phone: `+90${randomHex(10)}`,
                        },
                    })),
                });
                const customers = await tx.customer.findMany({
                    where: { tenantId },
                    orderBy: { createdAt: 'desc' },
                    take: batchItems.length,
                    select: { id: true },
                });
                const subscriptionsData = batchItems.map((item, idx) => {
                    globalSubscriptionCounter++;
                    return {
                        tenantId,
                        subscriptionNumber: `S-${batch.serialPrefix}-${String(globalSubscriptionCounter).padStart(4, '0')}`,
                        customerId: customers[idx]?.id || customers[0].id,
                        subscriptionGroup: client_1.SubscriptionGroup.NORMAL_CONSUMPTION,
                        address: {
                            city,
                            district: 'Merkez',
                            neighborhood: `Mahalle ${globalSubscriptionCounter}`,
                            street: `Sokak ${globalSubscriptionCounter}`,
                            buildingNo: String(Math.floor(Math.random() * 100) + 1),
                        },
                        latitude: item.coords.lat,
                        longitude: item.coords.lng,
                        isActive: true,
                        startDate: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
                    };
                });
                await tx.subscription.createMany({ data: subscriptionsData });
                const subscriptions = await tx.subscription.findMany({
                    where: { tenantId },
                    orderBy: { createdAt: 'desc' },
                    take: batchItems.length,
                    select: { id: true },
                });
                const metersData = batchItems.map((item, idx) => ({
                    serialNumber: item.meterSerial,
                    tenantId,
                    subscriptionId: subscriptions[idx]?.id || subscriptions[0].id,
                    meterProfileId,
                    activeDeviceId: deviceMap.get(item.deviceSerial),
                    initialIndex: Math.random() * 1000,
                    installationDate: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
                    status: client_1.MeterStatus.ACTIVE,
                }));
                await tx.meter.createMany({ data: metersData });
            }, { timeout: 60000 });
        }, batch.serialPrefix);
    }
    console.log(`\n   ✓ Total Devices: ${globalDeviceCounter}`);
    console.log(`   ✓ Total Customers: ${globalCustomerCounter}`);
    console.log(`   ✓ Total Subscriptions: ${globalSubscriptionCounter}`);
    console.log(`   ✓ Total Meters: ${globalMeterCounter}`);
}
async function createGoldenRecord(tenants, meterProfiles, deviceProfiles) {
    console.log('\n⭐ Creating Golden Record (Kemalettin ŞAHİN)...');
    const askiId = tenants['root.aski'];
    const locations = [
        { lat: 39.99451679511336, lng: 32.86308219026244, neighborhood: 'Tepebaşı Mahallesi', street: 'Foça Sokak', building: '100' },
        { lat: 39.89441311052211, lng: 32.81460781844764, neighborhood: 'Ehlibeyt Mahallesi', street: 'Tekstilciler Caddesi', building: '16' },
    ];
    const customer = await prisma.customer.create({
        data: {
            tenantId: askiId,
            customerNumber: 'CASKI-GOLDEN-001',
            customerType: client_1.CustomerType.INDIVIDUAL,
            details: {
                firstName: 'Kemalettin',
                lastName: 'ŞAHİN',
                tcIdNo: '12345678901',
                phone: '+905551234567',
                email: 'kemalettin.sahin@example.com',
            },
        },
    });
    console.log(`   ✓ Customer: Kemalettin ŞAHİN (${customer.id})`);
    const goldenDevices = await Promise.all([
        prisma.device.create({
            data: {
                serialNumber: 'GOLDEN-DEV-001',
                tenantId: askiId,
                deviceProfileId: deviceProfiles[1],
                status: client_1.DeviceStatus.ACTIVE,
                dynamicFields: { IMEI: '999999999990001', IMSI: '999999999990001' },
            },
        }),
        prisma.device.create({
            data: {
                serialNumber: 'GOLDEN-DEV-002',
                tenantId: askiId,
                deviceProfileId: deviceProfiles[1],
                status: client_1.DeviceStatus.ACTIVE,
                dynamicFields: { IMEI: '999999999990002', IMSI: '999999999990002' },
            },
        }),
    ]);
    console.log(`   ✓ Created 2 dedicated devices`);
    for (let i = 0; i < 2; i++) {
        const loc = locations[i];
        const subscription = await prisma.subscription.create({
            data: {
                tenantId: askiId,
                subscriptionNumber: `SASKI-GOLDEN-00${i + 1}`,
                customerId: customer.id,
                subscriptionGroup: client_1.SubscriptionGroup.NORMAL_CONSUMPTION,
                address: {
                    city: 'Ankara',
                    district: i === 0 ? 'Keçiören' : 'Çankaya',
                    neighborhood: loc.neighborhood,
                    street: loc.street,
                    buildingNo: loc.building,
                    floor: i === 0 ? '2' : '4',
                    postalCode: i === 0 ? '06390' : '06520',
                },
                latitude: loc.lat,
                longitude: loc.lng,
                isActive: true,
                startDate: new Date('2024-10-01'),
            },
        });
        const meter = await prisma.meter.create({
            data: {
                serialNumber: `GOLDEN-MTR-${i + 1}`,
                tenantId: askiId,
                subscriptionId: subscription.id,
                meterProfileId: meterProfiles[2],
                activeDeviceId: goldenDevices[i].id,
                initialIndex: 0,
                installationDate: new Date('2024-10-01'),
                status: client_1.MeterStatus.ACTIVE,
            },
        });
        console.log(`   ✓ Subscription ${i + 1} + Meter: ${meter.serialNumber} @ ${loc.neighborhood}`);
    }
}
async function generateHistoricalReadings() {
    console.log('\n📈 PART C: Generating Historical Readings (45 days, 24 readings/day)...');
    console.log('   ⏳ This may take a minute...\n');
    const startTime = Date.now();
    await prisma.$executeRaw `
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
      m.initial_index + (
        (EXTRACT(EPOCH FROM (time_series.ts - (NOW() - interval '45 days'))) / 3600)
        * (
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
        * (0.8 + random() * 0.4)
      ) as value,
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
      (-70 - (random() * 30)::int - (CASE WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 2 AND 5 THEN 5 ELSE 0 END))::int as signal_strength,
      GREATEST(85, 100 - ((EXTRACT(EPOCH FROM (time_series.ts - (NOW() - interval '45 days'))) / 86400) * 0.3)::int - (random() * 2)::int)::int as battery_level,
      (15.0 + (CASE 
          WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 12 AND 16 THEN 8
          WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 6 AND 11 THEN 4
          WHEN EXTRACT(HOUR FROM time_series.ts) BETWEEN 17 AND 20 THEN 5
          ELSE 0
        END) + (random() * 4 - 2))::decimal(5,2) as temperature,
      'LORAWAN' as source,
      m.active_device_id as source_device_id,
      'LORAWAN'::"CommunicationTechnology" as communication_technology,
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
    const countResult = await prisma.$queryRaw `SELECT COUNT(*) as count FROM readings`;
    const readingsCount = Number(countResult[0].count);
    console.log(`   ✓ Generated ${readingsCount.toLocaleString()} readings in ${duration}s`);
    console.log('   📊 Updating meters with last reading values...');
    await prisma.$executeRaw `
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
    console.log('   📡 Updating devices with last communication data...');
    await prisma.$executeRaw `
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
    WHERE d.id = r.source_device_id::uuid
  `;
    console.log('   ✓ Updated device communication data');
}
async function main() {
    console.log('='.repeat(80));
    console.log('🌱 READ WATER - SEED (Subscription Model)');
    console.log('='.repeat(80));
    const startTime = Date.now();
    await teardown();
    console.log('📊 PART B: DATA CREATION\n');
    const tenants = await createTenants();
    await createUsers(tenants);
    await createCommunicationTechDefs();
    const meterProfiles = await createMeterProfiles(tenants);
    const deviceProfiles = await createDeviceProfiles(meterProfiles);
    await createBulkAssets(tenants, meterProfiles, deviceProfiles);
    await createGoldenRecord(tenants, meterProfiles, deviceProfiles);
    await generateHistoricalReadings();
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(80));
    console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log(`\n⏱️  Total Duration: ${totalDuration}s\n`);
    console.log('📊 Summary:');
    console.log('   • Tenants: 3 (Root, ASKİ, HATSU)');
    console.log('   • Users: 3 (super.admin, aski.yetkili, hatsu.yetkili)');
    console.log('   • Password: Asdf1234.');
    console.log('   • Meter Profiles: 10');
    console.log('   • Device Profiles: 7');
    console.log('   • HATSU: 50 Customers → 50 Subscriptions → 50 Meters');
    console.log('   • ASKİ: 100 Customers → 100 Subscriptions → 100 Meters');
    console.log('   • Golden Record: Kemalettin ŞAHİN (1 Customer → 2 Subscriptions → 2 Meters)');
    console.log('');
    console.log('🔗 Entity Hierarchy:');
    console.log('   Tenant → Customer → Subscription (has Address) → Meter → Device');
    console.log('\n' + '='.repeat(80) + '\n');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map