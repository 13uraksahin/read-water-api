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
const prisma = new client_1.PrismaClient();
const communicationTechFieldDefs = [
    {
        technology: client_1.CommunicationTechnology.SIGFOX,
        integrationTypes: [client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
        technology: client_1.CommunicationTechnology.LORAWAN,
        integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
        technology: client_1.CommunicationTechnology.NB_IOT,
        integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
        technology: client_1.CommunicationTechnology.WM_BUS,
        integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
        technology: client_1.CommunicationTechnology.MIOTY,
        integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
        technology: client_1.CommunicationTechnology.WIFI,
        integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
        technology: client_1.CommunicationTechnology.BLUETOOTH,
        integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
        technology: client_1.CommunicationTechnology.NFC,
        integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
        technology: client_1.CommunicationTechnology.OMS,
        integrationTypes: [client_1.IntegrationType.MQTT, client_1.IntegrationType.HTTP, client_1.IntegrationType.API],
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
const deviceProfiles = [
    {
        brand: client_1.DeviceBrand.UNA,
        modelCode: 'UNA-LORA-01',
        communicationTechnology: client_1.CommunicationTechnology.LORAWAN,
        integrationType: client_1.IntegrationType.MQTT,
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
        brand: client_1.DeviceBrand.IMA,
        modelCode: 'IMA-SIGFOX-01',
        communicationTechnology: client_1.CommunicationTechnology.SIGFOX,
        integrationType: client_1.IntegrationType.HTTP,
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
        brand: client_1.DeviceBrand.ITRON,
        modelCode: 'ITRON-NBIOT-01',
        communicationTechnology: client_1.CommunicationTechnology.NB_IOT,
        integrationType: client_1.IntegrationType.HTTP,
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
        brand: client_1.DeviceBrand.ZENNER,
        modelCode: 'ZENNER-WMBUS-01',
        communicationTechnology: client_1.CommunicationTechnology.WM_BUS,
        integrationType: client_1.IntegrationType.MQTT,
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
const meterProfiles = [
    {
        brand: client_1.Brand.BAYLAN,
        modelCode: 'TK-3S-DN15',
        meterType: client_1.MeterType.MULTI_JET,
        dialType: client_1.DialType.DRY,
        connectionType: client_1.ConnectionType.THREAD,
        mountingType: client_1.MountingType.HORIZONTAL,
        temperatureType: client_1.TemperatureType.T30,
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
        ipRating: client_1.IPRating.IP68,
        communicationModule: client_1.CommunicationModule.RETROFIT,
        specifications: { material: 'Brass', maxPressure: '16 bar' },
    },
    {
        brand: client_1.Brand.ZENNER,
        modelCode: 'MTKD-N-DN20',
        meterType: client_1.MeterType.MULTI_JET,
        dialType: client_1.DialType.SUPER_DRY,
        connectionType: client_1.ConnectionType.THREAD,
        mountingType: client_1.MountingType.BOTH,
        temperatureType: client_1.TemperatureType.T30,
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
        ipRating: client_1.IPRating.IP68,
        communicationModule: client_1.CommunicationModule.INTEGRATED,
        specifications: { material: 'Composite', maxPressure: '16 bar' },
    },
    {
        brand: client_1.Brand.MANAS,
        modelCode: 'MNS-US-DN25',
        meterType: client_1.MeterType.ULTRASONIC,
        dialType: client_1.DialType.DRY,
        connectionType: client_1.ConnectionType.FLANGE,
        mountingType: client_1.MountingType.HORIZONTAL,
        temperatureType: client_1.TemperatureType.T30,
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
        ipRating: client_1.IPRating.IP68,
        communicationModule: client_1.CommunicationModule.INTEGRATED,
        specifications: { material: 'Stainless Steel', maxPressure: '16 bar', noMovingParts: true },
    },
];
async function main() {
    console.log('🌱 Starting database seed...\n');
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
            subscriptionStatus: client_1.SubscriptionStatus.ACTIVE,
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
    console.log('\n👤 Creating Platform Admin User...');
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
    console.log('\n🔑 Assigning Platform Admin role...');
    await prisma.userTenant.upsert({
        where: {
            userId_tenantId: {
                userId: adminUser.id,
                tenantId: rootTenant.id,
            },
        },
        update: {
            role: client_1.SystemRole.PLATFORM_ADMIN,
        },
        create: {
            userId: adminUser.id,
            tenantId: rootTenant.id,
            role: client_1.SystemRole.PLATFORM_ADMIN,
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
    console.log('\n📱 Creating Device Profiles...');
    const createdDeviceProfiles = {};
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
    console.log('\n📊 Creating Meter Profiles...');
    const createdMeterProfiles = {};
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
    console.log('\n🔗 Creating Compatible Device Profile Relationships...');
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
    console.log('\n📦 Creating Sample Warehouse Devices...');
    const unaDeviceProfileId = Object.values(createdDeviceProfiles).find(p => p.brand === client_1.DeviceBrand.UNA)?.id;
    const imaDeviceProfileId = Object.values(createdDeviceProfiles).find(p => p.brand === client_1.DeviceBrand.IMA)?.id;
    const itronDeviceProfileId = Object.values(createdDeviceProfiles).find(p => p.brand === client_1.DeviceBrand.ITRON)?.id;
    const zennerDeviceProfileId = Object.values(createdDeviceProfiles).find(p => p.brand === client_1.DeviceBrand.ZENNER)?.id;
    const warehouseDevices = [
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
                status: client_1.DeviceStatus.WAREHOUSE,
                dynamicFields: device.dynamicFields,
                metadata: {
                    createdBy: 'seed',
                    batchNumber: 'SEED-2024-001',
                },
            },
        });
        console.log(`   ✓ ${device.serialNumber} (WAREHOUSE)`);
    }
    console.log('\n🔗 Linking Meter Profiles to Root Tenant...');
    const allMeterProfileIds = Object.values(createdMeterProfiles).map(p => ({ id: p.id }));
    await prisma.tenant.update({
        where: { id: rootTenant.id },
        data: {
            allowedProfiles: {
                connect: allMeterProfileIds,
            },
        },
    });
    console.log(`   ✓ Linked ${allMeterProfileIds.length} Meter Profiles to ${rootTenant.name}`);
    console.log('\n👥 Creating Sample Customers...');
    const sampleCustomers = [
        {
            customerType: 'INDIVIDUAL',
            consumptionType: 'NORMAL',
            details: {
                firstName: 'Ahmet',
                lastName: 'Yılmaz',
                tcIdNo: '12345678901',
                phone: '+905551234567',
                email: 'ahmet.yilmaz@example.com',
            },
            address: {
                city: 'Istanbul',
                district: 'Kadıköy',
                neighborhood: 'Caferağa',
                street: 'Moda Caddesi',
                buildingNo: '42',
                floor: '3',
                doorNo: '7',
                postalCode: '34710',
                extraDetails: 'Near Moda Park',
            },
            latitude: 40.9876,
            longitude: 29.0234,
        },
        {
            customerType: 'INDIVIDUAL',
            consumptionType: 'HIGH',
            details: {
                firstName: 'Fatma',
                lastName: 'Demir',
                tcIdNo: '23456789012',
                phone: '+905552345678',
                email: 'fatma.demir@example.com',
            },
            address: {
                city: 'Istanbul',
                district: 'Beşiktaş',
                neighborhood: 'Levent',
                street: 'Büyükdere Caddesi',
                buildingNo: '100',
                floor: '15',
                doorNo: '1501',
                postalCode: '34394',
                extraDetails: 'Levent Plaza',
            },
            latitude: 41.0821,
            longitude: 29.0115,
        },
        {
            customerType: 'ORGANIZATIONAL',
            consumptionType: 'HIGH',
            details: {
                organizationName: 'ABC Su Sanayi A.Ş.',
                taxId: '1234567890',
                taxOffice: 'Kadıköy',
                contactFirstName: 'Mehmet',
                contactLastName: 'Öztürk',
                contactPhone: '+905553456789',
                contactEmail: 'mehmet.ozturk@abcsu.com',
            },
            address: {
                city: 'Istanbul',
                district: 'Tuzla',
                neighborhood: 'Organize Sanayi',
                street: '2. Cadde',
                buildingNo: '15',
                floor: '1',
                doorNo: '1',
                postalCode: '34956',
                extraDetails: 'ABC Su Factory',
            },
            latitude: 40.8234,
            longitude: 29.2987,
        },
    ];
    const createdCustomers = [];
    for (const customer of sampleCustomers) {
        const created = await prisma.customer.upsert({
            where: {
                id: '00000000-0000-0000-0000-000000000000',
            },
            update: {},
            create: {
                tenantId: rootTenant.id,
                customerType: customer.customerType,
                consumptionType: customer.consumptionType,
                details: customer.details,
                address: customer.address,
                latitude: customer.latitude,
                longitude: customer.longitude,
            },
        });
        const customerName = customer.customerType === 'INDIVIDUAL'
            ? `${customer.details.firstName} ${customer.details.lastName}`
            : customer.details.organizationName;
        createdCustomers.push({ id: created.id, name: customerName });
        console.log(`   ✓ ${customerName} (${customer.customerType})`);
    }
    console.log('\n📊 Creating Sample Meters Linked to Customers...');
    const firstCustomer = createdCustomers[0];
    const secondCustomer = createdCustomers[1];
    const thirdCustomer = createdCustomers[2];
    const baylanMeterProfileId = createdMeterProfiles['BAYLAN-TK-3S-DN15']?.id;
    const zennerMeterProfileId = createdMeterProfiles['ZENNER-MTKD-N-DN20']?.id;
    const manasMeterProfileId = createdMeterProfiles['MANAS-MNS-US-DN25']?.id;
    const sampleMeters = [
        {
            customerId: firstCustomer.id,
            meterProfileId: baylanMeterProfileId,
            serialNumber: 'MTR-2024-001',
            initialIndex: 0,
            installationDate: new Date('2024-01-15T08:00:00Z'),
            status: 'ACTIVE',
            address: {
                city: 'Istanbul',
                district: 'Kadıköy',
                neighborhood: 'Caferağa',
                street: 'Moda Caddesi',
                buildingNo: '42',
                floor: 'B1',
                doorNo: 'SU-1',
                postalCode: '34710',
                extraDetails: 'Meter Room',
            },
            latitude: 40.9876,
            longitude: 29.0234,
        },
        {
            customerId: secondCustomer.id,
            meterProfileId: zennerMeterProfileId,
            serialNumber: 'MTR-2024-002',
            initialIndex: 1234.567,
            installationDate: new Date('2024-02-20T10:30:00Z'),
            status: 'ACTIVE',
            address: {
                city: 'Istanbul',
                district: 'Beşiktaş',
                neighborhood: 'Levent',
                street: 'Büyükdere Caddesi',
                buildingNo: '100',
                floor: 'B2',
                doorNo: 'SU-15',
                postalCode: '34394',
                extraDetails: 'Building Water Meter',
            },
            latitude: 41.0821,
            longitude: 29.0115,
        },
        {
            customerId: thirdCustomer.id,
            meterProfileId: manasMeterProfileId,
            serialNumber: 'MTR-2024-003',
            initialIndex: 98765.432,
            installationDate: new Date('2024-03-10T14:00:00Z'),
            status: 'ACTIVE',
            address: {
                city: 'Istanbul',
                district: 'Tuzla',
                neighborhood: 'Organize Sanayi',
                street: '2. Cadde',
                buildingNo: '15',
                floor: '1',
                doorNo: 'MAIN',
                postalCode: '34956',
                extraDetails: 'Factory Main Water Meter',
            },
            latitude: 40.8234,
            longitude: 29.2987,
        },
    ];
    const createdMeters = [];
    for (const meter of sampleMeters) {
        if (!meter.meterProfileId) {
            console.log(`   ⚠ Skipping meter - no profile found`);
            continue;
        }
        const created = await prisma.meter.upsert({
            where: { serialNumber: meter.serialNumber },
            update: {},
            create: {
                tenantId: rootTenant.id,
                customerId: meter.customerId,
                meterProfileId: meter.meterProfileId,
                serialNumber: meter.serialNumber,
                initialIndex: meter.initialIndex,
                installationDate: meter.installationDate,
                status: meter.status,
                address: meter.address,
                latitude: meter.latitude,
                longitude: meter.longitude,
            },
        });
        createdMeters.push({ id: created.id, serialNumber: created.serialNumber });
        const customerName = createdCustomers.find(c => c.id === meter.customerId)?.name || 'Unknown';
        console.log(`   ✓ ${meter.serialNumber} -> Customer: ${customerName}`);
    }
    console.log('\n🔗 Linking Demo Device to Meter...');
    const firstDevice = await prisma.device.findFirst({
        where: { serialNumber: 'UNA-LW-001' },
    });
    const firstMeter = createdMeters[0];
    if (firstDevice && firstMeter) {
        await prisma.meter.update({
            where: { id: firstMeter.id },
            data: { activeDeviceId: firstDevice.id },
        });
        await prisma.device.update({
            where: { id: firstDevice.id },
            data: { status: client_1.DeviceStatus.ACTIVE },
        });
        console.log(`   ✓ Linked ${firstDevice.serialNumber} -> ${firstMeter.serialNumber}`);
    }
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
    console.log(`   • Sample Customers: ${createdCustomers.length}`);
    console.log(`   • Sample Meters: ${createdMeters.length}`);
    console.log(`   • Global Settings: ${globalSettings.length}`);
    console.log('='.repeat(70) + '\n');
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