// =============================================================================
// Read Water API - End-to-End Tests
// =============================================================================
// Tests the full application flow from auth to asset/device management
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/prisma/prisma.service';
import {
  Brand,
  CommunicationTechnology,
  CommunicationModule,
  ConnectionType,
  DialType,
  DeviceBrand,
  DeviceStatus,
  IntegrationType,
  MeterStatus,
  MeterType,
  MountingType,
  TemperatureType,
} from '@prisma/client';

describe('Read Water API (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Store created entities for cleanup and assertions
  const testData = {
    tenantId: '',
    userId: '',
    accessToken: '',
    refreshToken: '',
    deviceProfileId: '',
    meterProfileId: '',
    deviceId: '',
    meterId: '',
    customerId: '',
  };

  // Test user credentials
  const testUser = {
    email: `e2e-test-${Date.now()}@readwater.test`,
    password: 'TestPassword123!',
    firstName: 'E2E',
    lastName: 'Tester',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    // Clean up any previous test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    try {
      // Delete in reverse order of creation (respecting foreign keys)
      if (testData.meterId) {
        await prisma.meter.delete({ where: { id: testData.meterId } }).catch(() => {});
      }
      if (testData.deviceId) {
        await prisma.device.delete({ where: { id: testData.deviceId } }).catch(() => {});
      }
      if (testData.customerId) {
        await prisma.customer.delete({ where: { id: testData.customerId } }).catch(() => {});
      }
      if (testData.deviceProfileId) {
        await prisma.deviceProfile.delete({ where: { id: testData.deviceProfileId } }).catch(() => {});
      }
      if (testData.meterProfileId) {
        await prisma.meterProfile.delete({ where: { id: testData.meterProfileId } }).catch(() => {});
      }
      if (testData.userId) {
        await prisma.userTenant.deleteMany({ where: { userId: testData.userId } }).catch(() => {});
        await prisma.refreshToken.deleteMany({ where: { userId: testData.userId } }).catch(() => {});
        await prisma.activityLog.deleteMany({ where: { userId: testData.userId } }).catch(() => {});
        await prisma.user.delete({ where: { id: testData.userId } }).catch(() => {});
      }
      // Tenants are preserved if they're needed by other tests
    } catch (error) {
      console.log('Cleanup error (may be expected):', error.message);
    }
  }

  // =========================================================================
  // SETUP: Get or create a test tenant
  // =========================================================================
  describe('Setup - Test Tenant', () => {
    it('should find or create a test tenant', async () => {
      // First, try to find an existing tenant
      let tenant = await prisma.tenant.findFirst({
        where: { name: { contains: 'Root' } },
      });

      if (!tenant) {
        // Create a root tenant for testing
        tenant = await prisma.tenant.create({
          data: {
            name: 'E2E Test Root',
            path: 'E2ERoot',
            contactFirstName: 'E2E',
            contactLastName: 'Admin',
            contactEmail: 'e2e@test.com',
          },
        });
      }

      testData.tenantId = tenant.id;
      expect(testData.tenantId).toBeDefined();
    });
  });

  // =========================================================================
  // AUTH TESTS
  // =========================================================================
  describe('Authentication Flow', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            ...testUser,
            tenantId: testData.tenantId,
          })
          .expect(201);

        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);

        testData.accessToken = response.body.accessToken;
        testData.refreshToken = response.body.refreshToken;
        testData.userId = response.body.user.id;
      });

      it('should reject duplicate email registration', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            ...testUser,
            tenantId: testData.tenantId,
          })
          .expect(400);
      });

      it('should reject invalid email format', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email: 'invalid-email',
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            tenantId: testData.tenantId,
          })
          .expect(400);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(201);

        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);

        // Update tokens
        testData.accessToken = response.body.accessToken;
        testData.refreshToken = response.body.refreshToken;
      });

      it('should reject invalid password', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!',
          })
          .expect(401);
      });

      it('should reject non-existent user', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'TestPassword123!',
          })
          .expect(401);
      });
    });

    describe('POST /api/v1/auth/refresh', () => {
      it('should refresh access token', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .send({
            refreshToken: testData.refreshToken,
          })
          .expect(201);

        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();

        // Update tokens for subsequent tests
        testData.accessToken = response.body.accessToken;
        testData.refreshToken = response.body.refreshToken;
      });

      it('should reject invalid refresh token', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .send({
            refreshToken: 'invalid-token',
          })
          .expect(401);
      });
    });

    describe('GET /api/v1/auth/me', () => {
      it('should return current user profile', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .expect(200);

        expect(response.body.email).toBe(testUser.email);
        expect(response.body.firstName).toBe(testUser.firstName);
        expect(response.body.tenants).toBeDefined();
        expect(response.body.tenants.length).toBeGreaterThan(0);
      });

      it('should reject unauthenticated request', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .expect(401);
      });
    });
  });

  // =========================================================================
  // FULL CYCLE TESTS: Device Profile → Device → Meter Profile → Meter → Link
  // =========================================================================
  describe('Full Asset/Device Cycle', () => {
    // Step 1: Create Device Profile (LoRaWAN)
    describe('Step 1: Create Device Profile', () => {
      it('POST /api/v1/device-profiles - should create a LoRaWAN device profile', async () => {
        const deviceProfileData = {
          brand: DeviceBrand.UNA,
          modelCode: `E2E-LW-${Date.now()}`,
          communicationTechnology: CommunicationTechnology.LORAWAN,
          integrationType: IntegrationType.HTTP,
          fieldDefinitions: [
            {
              name: 'DevEUI',
              label: 'Device EUI',
              type: 'hex',
              length: 16,
              regex: '^[a-fA-F0-9]{16}$',
              required: true,
            },
            {
              name: 'JoinEUI',
              label: 'Join EUI',
              type: 'hex',
              length: 16,
              regex: '^[a-fA-F0-9]{16}$',
              required: true,
            },
            {
              name: 'AppKey',
              label: 'Application Key',
              type: 'hex',
              length: 32,
              regex: '^[a-fA-F0-9]{32}$',
              required: true,
            },
          ],
          decoderFunction: `
            // LoRaWAN payload decoder
            const bytes = Buffer.from(payload, 'hex');
            const value = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
            return { value: value / 1000, unit: 'm3' };
          `,
          testPayload: '00015180', // Test payload
          batteryLifeMonths: 120,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/device-profiles')
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send(deviceProfileData)
          .expect(201);

        expect(response.body.id).toBeDefined();
        expect(response.body.brand).toBe(DeviceBrand.UNA);
        expect(response.body.communicationTechnology).toBe(CommunicationTechnology.LORAWAN);

        testData.deviceProfileId = response.body.id;
      });

      it('GET /api/v1/device-profiles/:id - should retrieve the created device profile', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/device-profiles/${testData.deviceProfileId}`)
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(testData.deviceProfileId);
        expect(response.body.fieldDefinitions).toBeDefined();
        expect(response.body.decoderFunction).toBeDefined();
      });
    });

    // Step 2: Create Meter Profile (Mechanical)
    describe('Step 2: Create Meter Profile', () => {
      it('POST /api/v1/profiles - should create a mechanical meter profile', async () => {
        const meterProfileData = {
          brand: Brand.BAYLAN,
          modelCode: `E2E-TK-${Date.now()}`,
          meterType: MeterType.SINGLE_JET,
          dialType: DialType.DRY,
          connectionType: ConnectionType.THREAD,
          mountingType: MountingType.HORIZONTAL,
          temperatureType: TemperatureType.T30,
          diameter: 15,
          length: 165,
          width: 70,
          height: 90,
          q1: 0.01,
          q2: 0.016,
          q3: 2.5,
          q4: 3.125,
          pressureLoss: 0.63,
          communicationModule: CommunicationModule.RETROFIT,
          compatibleDeviceProfileIds: [testData.deviceProfileId],
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/profiles')
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send(meterProfileData)
          .expect(201);

        expect(response.body.id).toBeDefined();
        expect(response.body.brand).toBe(Brand.BAYLAN);
        expect(response.body.meterType).toBe(MeterType.SINGLE_JET);
        expect(response.body.compatibleDeviceProfiles).toHaveLength(1);

        testData.meterProfileId = response.body.id;
      });
    });

    // Step 3: Create Device (Inventory)
    describe('Step 3: Create Device (Inventory)', () => {
      it('POST /api/v1/devices - should create a device in inventory', async () => {
        const deviceData = {
          tenantId: testData.tenantId,
          deviceProfileId: testData.deviceProfileId,
          serialNumber: `E2E-DEV-${Date.now()}`,
          dynamicFields: {
            DevEUI: 'E2E0112233445566',
            JoinEUI: 'E2E0112233445566',
            AppKey: 'E2E0112233445566778899AABBCCDDEEFF',
          },
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/devices')
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send(deviceData)
          .expect(201);

        expect(response.body.id).toBeDefined();
        expect(response.body.serialNumber).toBe(deviceData.serialNumber);
        expect(response.body.status).toBe(DeviceStatus.WAREHOUSE);
        expect(response.body.dynamicFields).toBeDefined();
        expect(response.body.dynamicFields.DevEUI).toBe(deviceData.dynamicFields.DevEUI);

        testData.deviceId = response.body.id;
      });

      it('should reject device with invalid dynamic field format', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/devices')
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send({
            tenantId: testData.tenantId,
            deviceProfileId: testData.deviceProfileId,
            serialNumber: `E2E-INVALID-${Date.now()}`,
            dynamicFields: {
              DevEUI: 'INVALID', // Too short
              JoinEUI: 'E2E0112233445566',
              AppKey: 'E2E0112233445566778899AABBCCDDEEFF',
            },
          })
          .expect(400);
      });
    });

    // Step 4: Create Customer
    describe('Step 4: Create Customer', () => {
      it('POST /api/v1/customers - should create a customer', async () => {
        const customerData = {
          tenantId: testData.tenantId,
          customerType: 'INDIVIDUAL',
          consumptionType: 'NORMAL',
          details: {
            firstName: 'E2E',
            lastName: 'Customer',
            tcIdNo: '12345678901',
            phone: '+905551234567',
            email: 'e2e.customer@test.com',
          },
          address: {
            city: 'Istanbul',
            district: 'Kadikoy',
            neighborhood: 'Caferaga',
            street: 'Test Street',
            buildingNo: '123',
          },
          latitude: 41.0082,
          longitude: 28.9784,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/customers')
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send(customerData)
          .expect(201);

        expect(response.body.id).toBeDefined();
        expect(response.body.customerType).toBe('INDIVIDUAL');

        testData.customerId = response.body.id;
      });
    });

    // Step 5: Create Meter (Asset)
    describe('Step 5: Create Meter (Asset)', () => {
      it('POST /api/v1/meters - should create a meter asset', async () => {
        const meterData = {
          tenantId: testData.tenantId,
          customerId: testData.customerId,
          meterProfileId: testData.meterProfileId,
          serialNumber: `E2E-MTR-${Date.now()}`,
          initialIndex: 0,
          installationDate: new Date().toISOString(),
          status: MeterStatus.ACTIVE,
          address: {
            city: 'Istanbul',
            district: 'Kadikoy',
            neighborhood: 'Caferaga',
            street: 'Test Street',
            buildingNo: '123',
            floor: '3',
            doorNo: '5',
          },
          latitude: 41.0082,
          longitude: 28.9784,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/meters')
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send(meterData)
          .expect(201);

        expect(response.body.id).toBeDefined();
        expect(response.body.serialNumber).toBe(meterData.serialNumber);
        expect(response.body.activeDeviceId).toBeNull(); // No device linked yet
        expect(response.body.meterProfile).toBeDefined();

        testData.meterId = response.body.id;
      });
    });

    // Step 6: Link Device to Meter
    describe('Step 6: Link Device to Meter', () => {
      it('POST /api/v1/meters/:id/link-device - should link device to meter', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/meters/${testData.meterId}/link-device`)
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send({ deviceId: testData.deviceId })
          .expect(201);

        expect(response.body.activeDeviceId).toBe(testData.deviceId);
        expect(response.body.activeDevice).toBeDefined();
        expect(response.body.activeDevice.id).toBe(testData.deviceId);
      });

      it('should reject linking already linked device', async () => {
        // Try to link again
        await request(app.getHttpServer())
          .post(`/api/v1/meters/${testData.meterId}/link-device`)
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send({ deviceId: testData.deviceId })
          .expect(409); // Conflict - already has device
      });
    });

    // Step 7: Verify Final State
    describe('Step 7: Verify Final State', () => {
      it('GET /api/v1/meters/:id - meter should be active with linked device', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/meters/${testData.meterId}`)
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .expect(200);

        expect(response.body.status).toBe(MeterStatus.ACTIVE);
        expect(response.body.activeDeviceId).toBe(testData.deviceId);
        expect(response.body.activeDevice).toBeDefined();
        expect(response.body.customer).toBeDefined();
        expect(response.body.meterProfile).toBeDefined();
      });

      it('GET /api/v1/devices/:id - device should be in DEPLOYED status', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/devices/${testData.deviceId}`)
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .expect(200);

        expect(response.body.status).toBe(DeviceStatus.DEPLOYED);
        expect(response.body.linkedMeter).toBeDefined();
        expect(response.body.linkedMeter.id).toBe(testData.meterId);
      });
    });

    // Step 8: Unlink Device
    describe('Step 8: Unlink Device', () => {
      it('POST /api/v1/meters/:id/unlink-device - should unlink device', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/meters/${testData.meterId}/unlink-device`)
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .send({ deviceStatus: 'MAINTENANCE' })
          .expect(201);

        expect(response.body.activeDeviceId).toBeNull();
      });

      it('GET /api/v1/devices/:id - device should be in MAINTENANCE status', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/devices/${testData.deviceId}`)
          .set('Authorization', `Bearer ${testData.accessToken}`)
          .expect(200);

        expect(response.body.status).toBe(DeviceStatus.MAINTENANCE);
        expect(response.body.linkedMeter).toBeUndefined();
      });
    });
  });

  // =========================================================================
  // DECODERS API TESTS (Read-Only)
  // =========================================================================
  describe('Decoders API (Read-Only)', () => {
    it('GET /api/v1/decoders - should list decoders (from device profiles)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/decoders')
        .set('Authorization', `Bearer ${testData.accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });

    it('GET /api/v1/decoders/:id - should get decoder by device profile ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/decoders/${testData.deviceProfileId}`)
        .set('Authorization', `Bearer ${testData.accessToken}`)
        .expect(200);

      // May return null if no decoder function, or decoder data
      if (response.body) {
        expect(response.body.deviceProfileId).toBe(testData.deviceProfileId);
      }
    });
  });

  // =========================================================================
  // DASHBOARD API TESTS
  // =========================================================================
  describe('Dashboard API', () => {
    it('GET /api/v1/dashboard/stats - should return dashboard statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${testData.accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  // =========================================================================
  // LOGOUT TEST (Final)
  // =========================================================================
  describe('Logout', () => {
    it('POST /api/v1/auth/logout - should logout user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${testData.accessToken}`)
        .send({ refreshToken: testData.refreshToken })
        .expect(201);
    });

    it('should reject old refresh token after logout', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: testData.refreshToken })
        .expect(401);
    });
  });
});
