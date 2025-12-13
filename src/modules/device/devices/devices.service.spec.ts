// =============================================================================
// DevicesService Unit Tests
// =============================================================================
// Tests inventory management: create, validate dynamic fields, bulk operations
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AuthenticatedUser } from '../../../common/interfaces';
import {
  DeviceStatus,
  SystemRole,
  CommunicationTechnology,
  DeviceBrand,
} from '@prisma/client';

describe('DevicesService', () => {
  let service: DevicesService;
  let prismaService: jest.Mocked<PrismaService>;

  // Mock authenticated users
  const mockPlatformAdmin: AuthenticatedUser = {
    id: 'admin-uuid-123',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    tenantId: 'root-tenant-uuid',
    tenantPath: 'Root',
    role: SystemRole.PLATFORM_ADMIN,
    permissions: ['device.create', 'device.read', 'device.update', 'device.delete'],
  };

  const mockTenantAdmin: AuthenticatedUser = {
    id: 'tenant-admin-uuid',
    email: 'tenant@test.com',
    firstName: 'Tenant',
    lastName: 'Admin',
    tenantId: 'tenant-uuid-123',
    tenantPath: 'Root.TenantA',
    role: SystemRole.TENANT_ADMIN,
    permissions: ['device.create', 'device.read', 'device.update'],
  };

  // Mock entities
  const mockTenant = {
    id: 'tenant-uuid-123',
    name: 'Test Tenant',
    path: 'Root.TenantA',
  };

  const mockDeviceProfile = {
    id: 'device-profile-uuid',
    brand: DeviceBrand.UNA,
    modelCode: 'LW-100',
    communicationTechnology: CommunicationTechnology.LORAWAN,
    fieldDefinitions: [
      { name: 'DevEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
      { name: 'JoinEUI', type: 'hex', length: 16, regex: '^[a-fA-F0-9]{16}$', required: true },
      { name: 'AppKey', type: 'hex', length: 32, regex: '^[a-fA-F0-9]{32}$', required: true },
    ],
  };

  const mockDevice = {
    id: 'device-uuid-123',
    serialNumber: 'DEV-001',
    tenantId: 'tenant-uuid-123',
    deviceProfileId: 'device-profile-uuid',
    status: DeviceStatus.WAREHOUSE,
    dynamicFields: {
      DevEUI: '0011223344556677',
      JoinEUI: '0011223344556677',
      AppKey: '00112233445566778899AABBCCDDEEFF',
    },
    tenant: mockTenant,
    deviceProfile: mockDeviceProfile,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      tenant: {
        findUnique: jest.fn(),
      },
      deviceProfile: {
        findUnique: jest.fn(),
      },
      device: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      meter: {
        findFirst: jest.fn(),
      },
      meterProfile: {
        findUnique: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DevicesService>(DevicesService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validCreateDto = {
      tenantId: 'tenant-uuid-123',
      deviceProfileId: 'device-profile-uuid',
      serialNumber: 'DEV-NEW',
      dynamicFields: {
        DevEUI: 'AABBCCDDEEFF0011',
        JoinEUI: 'AABBCCDDEEFF0011',
        AppKey: 'AABBCCDDEEFF00112233445566778899', // 32 hex chars
      },
    };

    it('should create a device successfully with valid data', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      prismaService.device.findUnique.mockResolvedValue(null); // No duplicate
      prismaService.device.create.mockResolvedValue({
        ...mockDevice,
        serialNumber: validCreateDto.serialNumber,
        dynamicFields: validCreateDto.dynamicFields,
      });

      const result = await service.create(validCreateDto, mockPlatformAdmin);

      expect(result.serialNumber).toBe(validCreateDto.serialNumber);
      expect(prismaService.device.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: validCreateDto.tenantId,
            serialNumber: validCreateDto.serialNumber,
            status: DeviceStatus.WAREHOUSE,
          }),
        }),
      );
    });

    it('should throw ConflictException for duplicate serial number', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      prismaService.device.findUnique.mockResolvedValue(mockDevice); // Duplicate exists

      await expect(service.create(validCreateDto, mockPlatformAdmin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException for non-existent tenant', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.create(validCreateDto, mockPlatformAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-existent device profile', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(null);

      await expect(service.create(validCreateDto, mockPlatformAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException for tenant admin accessing wrong tenant', async () => {
      const otherTenant = { ...mockTenant, path: 'Root.OtherTenant' };
      prismaService.tenant.findUnique.mockResolvedValue(otherTenant);

      await expect(service.create(validCreateDto, mockTenantAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for missing required dynamic field', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      prismaService.device.findUnique.mockResolvedValue(null);

      const invalidDto = {
        ...validCreateDto,
        dynamicFields: {
          DevEUI: 'AABBCCDDEEFF0011',
          // Missing JoinEUI and AppKey
        },
      };

      await expect(service.create(invalidDto, mockPlatformAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid regex pattern', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      prismaService.device.findUnique.mockResolvedValue(null);

      const invalidDto = {
        ...validCreateDto,
        dynamicFields: {
          DevEUI: 'INVALID-NOT-HEX', // Invalid hex
          JoinEUI: 'AABBCCDDEEFF0011',
          AppKey: 'AABBCCDDEEFF0011223344556677889900',
        },
      };

      await expect(service.create(invalidDto, mockPlatformAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for wrong field length', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      prismaService.device.findUnique.mockResolvedValue(null);

      const invalidDto = {
        ...validCreateDto,
        dynamicFields: {
          DevEUI: 'AABBCCDD', // Too short (8 instead of 16)
          JoinEUI: 'AABBCCDDEEFF0011',
          AppKey: 'AABBCCDDEEFF0011223344556677889900',
        },
      };

      await expect(service.create(invalidDto, mockPlatformAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('bulkCreate', () => {
    const bulkDto = {
      tenantId: 'tenant-uuid-123',
      deviceProfileId: 'device-profile-uuid',
      devices: [
        {
          serialNumber: 'DEV-BULK-001',
          dynamicFields: {
            DevEUI: 'AABBCCDDEEFF0001',
            JoinEUI: 'AABBCCDDEEFF0001',
            AppKey: 'AABBCCDDEEFF001122334455667788AA', // 32 hex chars
          },
        },
        {
          serialNumber: 'DEV-BULK-002',
          dynamicFields: {
            DevEUI: 'AABBCCDDEEFF0002',
            JoinEUI: 'AABBCCDDEEFF0002',
            AppKey: 'AABBCCDDEEFF001122334455667788BB', // 32 hex chars
          },
        },
        {
          serialNumber: 'DEV-BULK-003',
          dynamicFields: {
            DevEUI: 'AABBCCDDEEFF0003',
            JoinEUI: 'AABBCCDDEEFF0003',
            AppKey: 'AABBCCDDEEFF001122334455667788CC', // 32 hex chars
          },
        },
      ],
    };

    it('should bulk create devices successfully', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      prismaService.device.findUnique.mockResolvedValue(null);
      prismaService.device.create.mockResolvedValue(mockDevice);

      const result = await service.bulkCreate(bulkDto, mockPlatformAdmin);

      expect(result.created).toBe(3);
      expect(result.errors).toHaveLength(0);
      expect(prismaService.device.create).toHaveBeenCalledTimes(3);
    });

    it('should skip devices with duplicate serial numbers', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      // First two are new, third is duplicate
      prismaService.device.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockDevice);
      prismaService.device.create.mockResolvedValue(mockDevice);

      const result = await service.bulkCreate(bulkDto, mockPlatformAdmin);

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Already exists');
    });

    it('should handle validation errors in bulk create', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      prismaService.device.findUnique.mockResolvedValue(null);

      const validDevice1 = {
        serialNumber: 'DEV-VALID-001',
        dynamicFields: {
          DevEUI: 'AABBCCDDEEFF0011',
          JoinEUI: 'AABBCCDDEEFF0011',
          AppKey: 'AABBCCDDEEFF001122334455667788DD',
        },
      };

      const invalidDevice = {
        serialNumber: 'DEV-INVALID',
        dynamicFields: { DevEUI: 'invalid' }, // Missing required fields
      };

      const validDevice2 = {
        serialNumber: 'DEV-VALID-002',
        dynamicFields: {
          DevEUI: 'AABBCCDDEEFF0022',
          JoinEUI: 'AABBCCDDEEFF0022',
          AppKey: 'AABBCCDDEEFF001122334455667788EE',
        },
      };

      const invalidBulkDto = {
        tenantId: 'tenant-uuid-123',
        deviceProfileId: 'device-profile-uuid',
        devices: [validDevice1, invalidDevice, validDevice2],
      };

      prismaService.device.create
        .mockResolvedValueOnce(mockDevice)
        .mockResolvedValueOnce(mockDevice);

      const result = await service.bulkCreate(invalidBulkDto, mockPlatformAdmin);

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return device with linked meter information', async () => {
      prismaService.device.findUnique.mockResolvedValue(mockDevice);
      prismaService.meter.findFirst.mockResolvedValue({
        id: 'meter-uuid-123',
        serialNumber: 'MTR-001',
        customer: { id: 'cust-1', details: {} },
        meterProfile: { brand: 'BAYLAN', modelCode: 'TK-5' },
      });

      const result = await service.findOne(mockDevice.id, mockPlatformAdmin);

      expect(result.id).toBe(mockDevice.id);
      expect(result.linkedMeter).toBeDefined();
      expect(result.linkedMeter.serialNumber).toBe('MTR-001');
    });

    it('should return device without linked meter', async () => {
      prismaService.device.findUnique.mockResolvedValue(mockDevice);
      prismaService.meter.findFirst.mockResolvedValue(null);

      const result = await service.findOne(mockDevice.id, mockPlatformAdmin);

      expect(result.id).toBe(mockDevice.id);
      expect(result.linkedMeter).toBeNull();
    });

    it('should throw NotFoundException for non-existent device', async () => {
      prismaService.device.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', mockPlatformAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for tenant admin accessing wrong tenant device', async () => {
      const otherTenantDevice = {
        ...mockDevice,
        tenant: { ...mockTenant, path: 'Root.OtherTenant' },
      };
      prismaService.device.findUnique.mockResolvedValue(otherTenantDevice);

      await expect(
        service.findOne(otherTenantDevice.id, mockTenantAdmin),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAvailable', () => {
    it('should return only WAREHOUSE devices with compatible profiles', async () => {
      const meterProfile = {
        id: 'meter-profile-uuid',
        compatibleDeviceProfiles: [{ id: 'device-profile-uuid' }],
      };
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.meterProfile.findUnique.mockResolvedValue(meterProfile);
      prismaService.device.findMany.mockResolvedValue([mockDevice]);

      const result = await service.findAvailable(
        mockTenant.id,
        meterProfile.id,
        mockPlatformAdmin,
      );

      expect(result).toHaveLength(1);
      expect(prismaService.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DeviceStatus.WAREHOUSE,
            deviceProfileId: { in: ['device-profile-uuid'] },
          }),
        }),
      );
    });

    it('should throw NotFoundException for non-existent meter profile', async () => {
      prismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      prismaService.meterProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.findAvailable(mockTenant.id, 'non-existent', mockPlatformAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update device status successfully', async () => {
      prismaService.device.findUnique.mockResolvedValue(mockDevice);
      prismaService.meter.findFirst.mockResolvedValue(null); // Not linked
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);
      prismaService.device.update.mockResolvedValue({
        ...mockDevice,
        status: DeviceStatus.MAINTENANCE,
      });

      const result = await service.update(
        mockDevice.id,
        { status: DeviceStatus.MAINTENANCE },
        mockPlatformAdmin,
      );

      expect(result.status).toBe(DeviceStatus.MAINTENANCE);
    });

    it('should throw BadRequestException when trying to set WAREHOUSE status on linked device', async () => {
      const linkedDevice = { ...mockDevice, linkedMeter: { id: 'meter-123' } };
      prismaService.device.findUnique.mockResolvedValue(mockDevice);
      prismaService.meter.findFirst.mockResolvedValue({ id: 'meter-123' }); // Linked

      await expect(
        service.update(
          mockDevice.id,
          { status: DeviceStatus.WAREHOUSE },
          mockPlatformAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate dynamic fields when updating', async () => {
      prismaService.device.findUnique.mockResolvedValue(mockDevice);
      prismaService.meter.findFirst.mockResolvedValue(null);
      prismaService.deviceProfile.findUnique.mockResolvedValue(mockDeviceProfile);

      await expect(
        service.update(
          mockDevice.id,
          { dynamicFields: { DevEUI: 'INVALID' } },
          mockPlatformAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete device successfully when not linked', async () => {
      prismaService.device.findUnique.mockResolvedValue(mockDevice);
      prismaService.meter.findFirst.mockResolvedValue(null);
      prismaService.device.delete.mockResolvedValue(mockDevice);

      await service.delete(mockDevice.id, mockPlatformAdmin);

      expect(prismaService.device.delete).toHaveBeenCalledWith({
        where: { id: mockDevice.id },
      });
    });

    it('should throw BadRequestException when device is linked to meter', async () => {
      prismaService.device.findUnique.mockResolvedValue(mockDevice);
      prismaService.meter.findFirst.mockResolvedValue({ id: 'meter-123' });

      await expect(
        service.delete(mockDevice.id, mockPlatformAdmin),
      ).rejects.toThrow(BadRequestException);
      expect(prismaService.device.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByDynamicField', () => {
    it('should find device by dynamic field', async () => {
      prismaService.$queryRaw.mockResolvedValue([mockDevice]);

      const result = await service.findByDynamicField('DevEUI', '0011223344556677');

      expect(result).toEqual(mockDevice);
      expect(prismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should return null when device not found', async () => {
      prismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.findByDynamicField('DevEUI', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated devices with filters', async () => {
      prismaService.device.findMany.mockResolvedValue([mockDevice]);
      prismaService.device.count.mockResolvedValue(1);

      const result = await service.findAll(
        { page: 1, limit: 10, status: DeviceStatus.WAREHOUSE },
        mockPlatformAdmin,
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by tenant path for non-platform admins', async () => {
      prismaService.device.findMany.mockResolvedValue([mockDevice]);
      prismaService.device.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10 }, mockTenantAdmin);

      expect(prismaService.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenant: { path: { startsWith: mockTenantAdmin.tenantPath } },
          }),
        }),
      );
    });

    it('should filter by device profile ID', async () => {
      prismaService.device.findMany.mockResolvedValue([mockDevice]);
      prismaService.device.count.mockResolvedValue(1);

      await service.findAll(
        { deviceProfileId: 'device-profile-uuid' },
        mockPlatformAdmin,
      );

      expect(prismaService.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deviceProfileId: 'device-profile-uuid',
          }),
        }),
      );
    });

    it('should filter by search term (serial number)', async () => {
      prismaService.device.findMany.mockResolvedValue([mockDevice]);
      prismaService.device.count.mockResolvedValue(1);

      await service.findAll({ search: 'DEV-001' }, mockPlatformAdmin);

      expect(prismaService.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ serialNumber: { contains: 'DEV-001', mode: 'insensitive' } }],
          }),
        }),
      );
    });
  });
});

