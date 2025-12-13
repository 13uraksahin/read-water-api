// =============================================================================
// IngestionService Unit Tests
// =============================================================================
// Tests the Device Lookup → Meter History flow using mocks
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { QUEUES } from '../../common/constants';
import { CommunicationTechnology } from '@prisma/client';

describe('IngestionService', () => {
  let service: IngestionService;
  let prismaService: jest.Mocked<PrismaService>;
  let redisService: jest.Mocked<RedisService>;
  let mockQueue: { add: jest.Mock };

  // Mock data
  const mockDeviceLookupResult = {
    id: 'device-uuid-123',
    tenant_id: 'tenant-uuid-123',
    device_profile_id: 'profile-uuid-123',
    meter_id: 'meter-uuid-123',
    decoder_function: 'return { value: parseInt(payload, 16) };',
  };

  const mockDeviceLookupNoMeter = {
    ...mockDeviceLookupResult,
    meter_id: null,
  };

  beforeEach(async () => {
    // Create mock queue
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };

    // Create mock Prisma service
    const mockPrismaService = {
      $queryRaw: jest.fn(),
    };

    // Create mock Redis service
    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: getQueueToken(QUEUES.READINGS),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ingestReading', () => {
    const validDto = {
      deviceId: '0011223344556677',
      payload: '0000100000',
      technology: CommunicationTechnology.LORAWAN,
    };

    it('should successfully queue a reading when device has a linked meter', async () => {
      // Mock cache miss
      redisService.get.mockResolvedValue(null);
      // Mock device lookup
      prismaService.$queryRaw.mockResolvedValue([mockDeviceLookupResult]);

      const result = await service.ingestReading(validDto);

      expect(result).toEqual({
        jobId: 'job-123',
        status: 'queued',
      });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-reading',
        expect.objectContaining({
          tenantId: mockDeviceLookupResult.tenant_id,
          meterId: mockDeviceLookupResult.meter_id,
          deviceId: validDto.deviceId,
          technology: validDto.technology,
          payload: validDto.payload,
        }),
        expect.any(Object),
      );
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should use cached device lookup when available', async () => {
      const cachedResult = JSON.stringify({
        deviceId: mockDeviceLookupResult.id,
        tenantId: mockDeviceLookupResult.tenant_id,
        meterId: mockDeviceLookupResult.meter_id,
        deviceProfileId: mockDeviceLookupResult.device_profile_id,
        decoderFunction: mockDeviceLookupResult.decoder_function,
      });
      redisService.get.mockResolvedValue(cachedResult);

      const result = await service.ingestReading(validDto);

      expect(result.status).toBe('queued');
      expect(prismaService.$queryRaw).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when device has no linked meter', async () => {
      redisService.get.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([mockDeviceLookupNoMeter]);

      await expect(service.ingestReading(validDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.ingestReading(validDto)).rejects.toThrow(
        /has no linked meter/,
      );
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when device is not found', async () => {
      redisService.get.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([]);

      await expect(service.ingestReading(validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should set higher priority for recent readings', async () => {
      redisService.get.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([mockDeviceLookupResult]);

      const recentDto = {
        ...validDto,
        timestamp: new Date().toISOString(), // Very recent
      };

      await service.ingestReading(recentDto);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-reading',
        expect.any(Object),
        expect.objectContaining({
          priority: 1, // Highest priority for recent data
        }),
      );
    });

    it('should set lower priority for older readings', async () => {
      redisService.get.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([mockDeviceLookupResult]);

      const oldTimestamp = new Date();
      oldTimestamp.setMinutes(oldTimestamp.getMinutes() - 2); // 2 minutes old

      const oldDto = {
        ...validDto,
        timestamp: oldTimestamp.toISOString(),
      };

      await service.ingestReading(oldDto);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-reading',
        expect.any(Object),
        expect.objectContaining({
          priority: 10, // Lower priority for old data
        }),
      );
    });
  });

  describe('ingestBatch', () => {
    const batchDto = {
      tenantId: 'tenant-uuid-123',
      readings: [
        { deviceId: 'dev1', payload: 'aabb', technology: CommunicationTechnology.LORAWAN },
        { deviceId: 'dev2', payload: 'ccdd', technology: CommunicationTechnology.LORAWAN },
        { deviceId: 'dev3', payload: 'eeff', technology: CommunicationTechnology.LORAWAN },
      ],
    };

    it('should queue multiple readings and skip devices without meters', async () => {
      redisService.get.mockResolvedValue(null);
      // First device has meter, second doesn't, third has meter
      prismaService.$queryRaw
        .mockResolvedValueOnce([mockDeviceLookupResult])
        .mockResolvedValueOnce([mockDeviceLookupNoMeter])
        .mockResolvedValueOnce([mockDeviceLookupResult]);

      const result = await service.ingestBatch(batchDto);

      expect(result.queued).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.jobIds).toHaveLength(2);
    });

    it('should handle errors gracefully in batch processing', async () => {
      redisService.get.mockResolvedValue(null);
      prismaService.$queryRaw
        .mockResolvedValueOnce([mockDeviceLookupResult])
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce([mockDeviceLookupResult]);

      const result = await service.ingestBatch(batchDto);

      expect(result.queued).toBe(2);
      expect(result.skipped).toBe(1);
    });
  });

  describe('handleLoRaWANUplink', () => {
    it('should correctly parse LoRaWAN uplink and extract metadata', async () => {
      redisService.get.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([mockDeviceLookupResult]);

      const lorawanDto = {
        devEUI: '0011223344556677',
        data: 'SGVsbG8=', // Base64 for "Hello"
        fPort: 1,
        fCnt: 100,
        rxInfo: [
          { rssi: -70, snr: 10.5, gatewayID: 'gw-123' },
          { rssi: -80, snr: 8.0, gatewayID: 'gw-456' },
        ],
        txInfo: {
          frequency: 868100000,
          dr: 5,
        },
      };

      await service.handleLoRaWANUplink(lorawanDto);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-reading',
        expect.objectContaining({
          deviceId: '0011223344556677',
          payload: '48656c6c6f', // Hex for "Hello"
          technology: CommunicationTechnology.LORAWAN,
          metadata: expect.objectContaining({
            fPort: 1,
            rssi: -70, // Best RSSI
            snr: 10.5,
            frequency: 868100000,
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('handleSigfoxCallback', () => {
    it('should correctly parse Sigfox callback', async () => {
      redisService.get.mockResolvedValue(null);
      prismaService.$queryRaw.mockResolvedValue([
        { ...mockDeviceLookupResult, meter_id: 'meter-123' },
      ]);

      const sigfoxDto = {
        device: 'ABC12345',
        data: 'deadbeef',
        time: Math.floor(Date.now() / 1000),
        seqNumber: 50,
        avgSnr: 15.5,
        station: 'station-1',
        rssi: -90,
      };

      await service.handleSigfoxCallback(sigfoxDto);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-reading',
        expect.objectContaining({
          deviceId: 'abc12345', // Lowercase
          payload: 'deadbeef',
          technology: CommunicationTechnology.SIGFOX,
          metadata: expect.objectContaining({
            seqNumber: 50,
            avgSnr: 15.5,
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('clearDeviceCache', () => {
    it('should clear specific device cache', async () => {
      await service.clearDeviceCache('LORAWAN', 'abc123');

      expect(redisService.del).toHaveBeenCalled();
    });
  });
});

