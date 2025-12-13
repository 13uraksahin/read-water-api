// =============================================================================
// MetersService Unit Tests
// =============================================================================
// Tests the Link/Unlink device logic using mocks
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { MetersService } from './meters.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { KyselyService } from '../../../core/kysely/kysely.service';
import { SYSTEM_ROLES } from '../../../common/constants';
import { AuthenticatedUser } from '../../../common/interfaces';
import { DeviceStatus, MeterStatus, ValveStatus, SystemRole } from '@prisma/client';

describe('MetersService', () => {
  let service: MetersService;
  let prismaService: jest.Mocked<PrismaService>;
  let kyselyService: jest.Mocked<KyselyService>;

  // Mock authenticated user
  const mockPlatformAdmin: AuthenticatedUser = {
    id: 'admin-uuid-123',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    tenantId: 'root-tenant-uuid',
    tenantPath: 'Root',
    role: SystemRole.PLATFORM_ADMIN,
    permissions: ['meter.create', 'meter.read', 'meter.update', 'meter.delete'],
  };

  const mockTenantAdmin: AuthenticatedUser = {
    id: 'tenant-admin-uuid',
    email: 'tenant@test.com',
    firstName: 'Tenant',
    lastName: 'Admin',
    tenantId: 'tenant-uuid-123',
    tenantPath: 'Root.TenantA',
    role: SystemRole.TENANT_ADMIN,
    permissions: ['meter.create', 'meter.read', 'meter.update'],
  };

  // Mock entities
  const mockTenant = {
    id: 'tenant-uuid-123',
    name: 'Test Tenant',
    path: 'Root.TenantA',
  };

  const mockCustomer = {
    id: 'customer-uuid-123',
    tenantId: 'tenant-uuid-123',
    details: { firstName: 'John', lastName: 'Doe' },
  };

  const mockMeterProfile = {
    id: 'meter-profile-uuid',
    brand: 'BAYLAN',
    modelCode: 'TK-5',
    meterType: 'SINGLE_JET',
    allowedTenants: [{ id: 'tenant-uuid-123' }],
  };

  const mockDeviceProfile = {
    id: 'device-profile-uuid',
    brand: 'UNA',
    modelCode: 'LW-100',
    communicationTechnology: 'LORAWAN',
    compatibleMeterProfiles: [{ id: 'meter-profile-uuid' }],
  };

  const mockDevice = {
    id: 'device-uuid-123',
    serialNumber: 'DEV-001',
    tenantId: 'tenant-uuid-123',
    status: DeviceStatus.WAREHOUSE,
    deviceProfileId: 'device-profile-uuid',
    tenant: mockTenant,
    deviceProfile: mockDeviceProfile,
  };

  const mockMeter = {
    id: 'meter-uuid-123',
    serialNumber: 'MTR-001',
    tenantId: 'tenant-uuid-123',
    customerId: 'customer-uuid-123',
    meterProfileId: 'meter-profile-uuid',
    activeDeviceId: null,
    status: MeterStatus.ACTIVE,
    valveStatus: ValveStatus.NOT_APPLICABLE,
    tenant: mockTenant,
    customer: mockCustomer,
    meterProfile: mockMeterProfile,
    activeDevice: null,
  };

  const mockMeterWithDevice = {
    ...mockMeter,
    activeDeviceId: 'device-uuid-123',
    activeDevice: mockDevice,
  };

  // Mock transaction helper
  const createMockTransaction = () => {
    const txMock = {
      device: {
        update: jest.fn().mockResolvedValue({ ...mockDevice, status: DeviceStatus.DEPLOYED }),
      },
      meter: {
        update: jest.fn().mockResolvedValue(mockMeterWithDevice),
      },
      activityLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    return txMock;
  };

  beforeEach(async () => {
    const mockPrismaService = {
      tenant: {
        findUnique: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
      },
      meterProfile: {
        findUnique: jest.fn(),
      },
      meter: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      device: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      reading: {
        count: jest.fn(),
      },
      activityLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockKyselyService = {
      getHourlyConsumption: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: KyselyService,
          useValue: mockKyselyService,
        },
      ],
    }).compile();

    service = module.get<MetersService>(MetersService);
    prismaService = module.get(PrismaService);
    kyselyService = module.get(KyselyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      tenantId: 'tenant-uuid-123',
      customerId: 'customer-uuid-123',
      meterProfileId: 'meter-profile-uuid',
      serialNumber: 'MTR-NEW',
      installationDate: new Date().toISOString(),
      address: { city: 'Istanbul' },
    };

    it('should create a meter successfully', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.meterProfile.findUnique.mockResolvedValue(mockMeterProfile);
      prismaService.meter.findUnique.mockResolvedValue(null); // No duplicate
      prismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      prismaService.meter.create.mockResolvedValue(mockMeter);

      const result = await service.create(createDto, mockPlatformAdmin);

      expect(result.serialNumber).toBe(mockMeter.serialNumber);
      expect(prismaService.meter.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for duplicate serial number', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.meterProfile.findUnique.mockResolvedValue(mockMeterProfile);
      prismaService.meter.findUnique.mockResolvedValue(mockMeter); // Duplicate exists

      await expect(service.create(createDto, mockPlatformAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException when tenant admin accesses wrong tenant', async () => {
      const otherTenant = { ...mockTenant, path: 'Root.OtherTenant' };
      prismaService.tenant.findUnique.mockResolvedValue(otherTenant);

      await expect(service.create(createDto, mockTenantAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when customer not found', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.meterProfile.findUnique.mockResolvedValue(mockMeterProfile);
      prismaService.meter.findUnique.mockResolvedValue(null);
      prismaService.customer.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto, mockPlatformAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('linkDevice', () => {
    const linkDto = {
      deviceId: 'device-uuid-123',
    };

    it('should link a device to a meter successfully', async () => {
      // Setup: Meter without device
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        alarms: [],
        readings: [],
      });
      // Device in warehouse
      prismaService.device.findUnique.mockResolvedValue({
        ...mockDevice,
        status: DeviceStatus.WAREHOUSE,
        deviceProfile: {
          ...mockDeviceProfile,
          compatibleMeterProfiles: [{ id: mockMeter.meterProfileId }],
        },
      });

      // Mock transaction
      prismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = createMockTransaction();
        return callback(txMock);
      });

      const result = await service.linkDevice(mockMeter.id, linkDto, mockPlatformAdmin);

      expect(result.activeDeviceId).toBe('device-uuid-123');
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException when meter already has a device', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeterWithDevice,
        alarms: [],
        readings: [],
      });

      await expect(
        service.linkDevice(mockMeter.id, linkDto, mockPlatformAdmin),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when device is not in WAREHOUSE status', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        alarms: [],
        readings: [],
      });
      prismaService.device.findUnique.mockResolvedValue({
        ...mockDevice,
        status: DeviceStatus.DEPLOYED, // Not available
      });

      await expect(
        service.linkDevice(mockMeter.id, linkDto, mockPlatformAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when device profile is not compatible', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        alarms: [],
        readings: [],
      });
      prismaService.device.findUnique.mockResolvedValue({
        ...mockDevice,
        deviceProfile: {
          ...mockDeviceProfile,
          compatibleMeterProfiles: [], // No compatible profiles
        },
      });

      await expect(
        service.linkDevice(mockMeter.id, linkDto, mockPlatformAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when device not found', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        alarms: [],
        readings: [],
      });
      prismaService.device.findUnique.mockResolvedValue(null);

      await expect(
        service.linkDevice(mockMeter.id, linkDto, mockPlatformAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlinkDevice', () => {
    const unlinkDto = {
      deviceStatus: 'WAREHOUSE',
    };

    it('should unlink a device from a meter successfully', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeterWithDevice,
        alarms: [],
        readings: [],
      });

      // Mock transaction
      prismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          device: {
            update: jest.fn().mockResolvedValue({ ...mockDevice, status: DeviceStatus.WAREHOUSE }),
          },
          meter: {
            update: jest.fn().mockResolvedValue({ ...mockMeter, activeDeviceId: null }),
          },
          activityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      const result = await service.unlinkDevice(mockMeter.id, unlinkDto, mockPlatformAdmin);

      expect(result.activeDeviceId).toBeNull();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when meter has no device to unlink', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        activeDeviceId: null,
        alarms: [],
        readings: [],
      });

      await expect(
        service.unlinkDevice(mockMeter.id, unlinkDto, mockPlatformAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set device to MAINTENANCE status when specified', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeterWithDevice,
        alarms: [],
        readings: [],
      });

      let capturedDeviceUpdate: any;
      prismaService.$transaction.mockImplementation(async (callback) => {
        const txMock = {
          device: {
            update: jest.fn().mockImplementation((args) => {
              capturedDeviceUpdate = args;
              return { ...mockDevice, status: DeviceStatus.MAINTENANCE };
            }),
          },
          meter: {
            update: jest.fn().mockResolvedValue({ ...mockMeter, activeDeviceId: null }),
          },
          activityLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txMock);
      });

      await service.unlinkDevice(
        mockMeter.id,
        { deviceStatus: 'MAINTENANCE' },
        mockPlatformAdmin,
      );

      expect(capturedDeviceUpdate.data.status).toBe('MAINTENANCE');
    });
  });

  describe('findOne', () => {
    it('should return meter with all relations', async () => {
      const fullMeter = {
        ...mockMeter,
        alarms: [],
        readings: [],
        activeDevice: {
          ...mockDevice,
          deviceProfile: mockDeviceProfile,
        },
      };
      prismaService.meter.findUnique.mockResolvedValue(fullMeter);

      const result = await service.findOne(mockMeter.id, mockPlatformAdmin);

      expect(result.id).toBe(mockMeter.id);
      expect(result.tenant).toBeDefined();
      expect(result.customer).toBeDefined();
      expect(result.meterProfile).toBeDefined();
    });

    it('should throw NotFoundException when meter not found', async () => {
      prismaService.meter.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockPlatformAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for tenant admin accessing wrong tenant meter', async () => {
      const otherTenantMeter = {
        ...mockMeter,
        tenant: { ...mockTenant, path: 'Root.OtherTenant' },
        alarms: [],
        readings: [],
      };
      prismaService.meter.findUnique.mockResolvedValue(otherTenantMeter);

      await expect(
        service.findOne(otherTenantMeter.id, mockTenantAdmin),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete meter successfully when no readings exist', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        alarms: [],
        readings: [],
      });
      prismaService.reading.count.mockResolvedValue(0);
      prismaService.meter.delete.mockResolvedValue(mockMeter);

      await service.delete(mockMeter.id, mockPlatformAdmin);

      expect(prismaService.meter.delete).toHaveBeenCalledWith({
        where: { id: mockMeter.id },
      });
    });

    it('should throw BadRequestException when meter has readings', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        alarms: [],
        readings: [],
      });
      prismaService.reading.count.mockResolvedValue(100);

      await expect(service.delete(mockMeter.id, mockPlatformAdmin)).rejects.toThrow(
        BadRequestException,
      );
      expect(prismaService.meter.delete).not.toHaveBeenCalled();
    });

    it('should unlink device before deleting meter', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeterWithDevice,
        alarms: [],
        readings: [],
      });
      prismaService.reading.count.mockResolvedValue(0);
      prismaService.device.update.mockResolvedValue({
        ...mockDevice,
        status: DeviceStatus.WAREHOUSE,
      });
      prismaService.meter.delete.mockResolvedValue(mockMeterWithDevice);

      await service.delete(mockMeterWithDevice.id, mockPlatformAdmin);

      expect(prismaService.device.update).toHaveBeenCalledWith({
        where: { id: mockMeterWithDevice.activeDeviceId },
        data: { status: DeviceStatus.WAREHOUSE },
      });
    });
  });

  describe('controlValve', () => {
    it('should throw BadRequestException for meter without valve support', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        valveStatus: ValveStatus.NOT_APPLICABLE,
        alarms: [],
        readings: [],
      });

      await expect(
        service.controlValve(
          mockMeter.id,
          { action: 'OPEN' },
          mockPlatformAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update valve status successfully', async () => {
      const meterWithValve = {
        ...mockMeter,
        valveStatus: ValveStatus.OPEN,
        alarms: [],
        readings: [],
      };
      prismaService.meter.findUnique.mockResolvedValue(meterWithValve);
      prismaService.meter.update.mockResolvedValue({
        ...meterWithValve,
        valveStatus: ValveStatus.CLOSED,
      });

      const result = await service.controlValve(
        mockMeter.id,
        { action: 'CLOSED' },
        mockPlatformAdmin,
      );

      expect(result.valveStatus).toBe(ValveStatus.CLOSED);
    });
  });

  describe('getReadingHistory', () => {
    it('should return reading history from Kysely', async () => {
      prismaService.meter.findUnique.mockResolvedValue({
        ...mockMeter,
        alarms: [],
        readings: [],
      });
      const mockHistory = [
        { hour: '2024-01-01T10:00:00Z', consumption: 1.5 },
        { hour: '2024-01-01T11:00:00Z', consumption: 2.0 },
      ];
      kyselyService.getHourlyConsumption.mockResolvedValue(mockHistory);

      const result = await service.getReadingHistory(mockMeter.id, mockPlatformAdmin, 7);

      expect(kyselyService.getHourlyConsumption).toHaveBeenCalled();
      expect(result).toEqual(mockHistory);
    });
  });
});

