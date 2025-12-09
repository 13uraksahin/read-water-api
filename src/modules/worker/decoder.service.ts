// =============================================================================
// Decoder Service - Safe Execution of Decoder Functions
// =============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { DecodedReading } from '../../common/interfaces';
import { CACHE_KEYS, CACHE_TTL } from '../../common/constants';
import * as vm from 'vm';

@Injectable()
export class DecoderService {
  private readonly logger = new Logger(DecoderService.name);

  // In-memory cache for decoder functions (compiled)
  private decoderCache = new Map<string, { fn: Function; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Execute decoder function for a reading
   */
  async decode(
    profileId: string,
    technology: string,
    payload: string,
  ): Promise<DecodedReading> {
    // Get decoder function
    const decoder = await this.getDecoderFunction(profileId, technology);

    if (!decoder) {
      // No decoder found - try to parse as simple hex value
      this.logger.warn(`No decoder found for profile ${profileId}, technology ${technology}`);
      return this.defaultDecode(payload);
    }

    try {
      // Execute decoder in sandboxed environment
      const result = await this.executeDecoder(decoder, payload);
      return this.validateDecodedResult(result);
    } catch (error) {
      this.logger.error(`Decoder execution failed: ${error.message}`);
      // Fall back to default decode
      return this.defaultDecode(payload);
    }
  }

  /**
   * Get decoder function from cache or database
   */
  private async getDecoderFunction(
    profileId: string,
    technology: string,
  ): Promise<string | null> {
    const cacheKey = `${profileId}:${technology}`;

    // Check in-memory cache first
    const cached = this.decoderCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.fn.toString();
    }

    // Check Redis cache
    const redisKey = CACHE_KEYS.DECODER_FUNCTION(`${profileId}:${technology}`);
    const redisValue = await this.redisService.get(redisKey);
    if (redisValue) {
      this.cacheDecoder(cacheKey, redisValue);
      return redisValue;
    }

    // Fetch from database
    const profile = await this.prisma.meterProfile.findUnique({
      where: { id: profileId },
      select: { communicationConfigs: true },
    });

    if (!profile || !profile.communicationConfigs) {
      return null;
    }

    // Find config for this technology
    const configs = profile.communicationConfigs as any[];
    const techConfig = configs.find(
      (c: any) => c.technology === technology,
    );

    if (!techConfig || !techConfig.decoder) {
      return null;
    }

    // Cache in Redis
    await this.redisService.set(redisKey, techConfig.decoder, CACHE_TTL.MEDIUM);

    // Cache in memory
    this.cacheDecoder(cacheKey, techConfig.decoder);

    return techConfig.decoder;
  }

  /**
   * Execute decoder in sandboxed VM
   */
  private async executeDecoder(
    decoderCode: string,
    payload: string,
  ): Promise<any> {
    // Create a sandbox context with limited globals
    const sandbox = {
      Buffer: Buffer,
      parseInt: parseInt,
      parseFloat: parseFloat,
      Math: Math,
      String: String,
      Number: Number,
      Array: Array,
      Object: Object,
      Date: Date,
      JSON: JSON,
      console: {
        log: (...args: any[]) => this.logger.debug('Decoder:', ...args),
        warn: (...args: any[]) => this.logger.warn('Decoder:', ...args),
        error: (...args: any[]) => this.logger.error('Decoder:', ...args),
      },
      payload: payload,
      result: null,
    };

    // Wrap decoder code in a function
    const wrappedCode = `
      (function() {
        ${decoderCode}
        
        // Call decode function if it exists
        if (typeof decode === 'function') {
          result = decode(payload);
        }
      })();
    `;

    try {
      // Create VM context
      const context = vm.createContext(sandbox);

      // Run with timeout
      vm.runInContext(wrappedCode, context, {
        timeout: 1000, // 1 second timeout
        displayErrors: true,
      });

      return sandbox.result;
    } catch (error) {
      this.logger.error(`VM execution error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Default decoder for simple hex payloads
   */
  private defaultDecode(payload: string): DecodedReading {
    try {
      const bytes = Buffer.from(payload, 'hex');

      // Try to extract value (assume first 4 bytes are value in big-endian)
      let value = 0;
      if (bytes.length >= 4) {
        value = bytes.readUInt32BE(0) / 1000; // Divide by 1000 for m³
      } else if (bytes.length >= 2) {
        value = bytes.readUInt16BE(0) / 100;
      } else if (bytes.length >= 1) {
        value = bytes.readUInt8(0);
      }

      return {
        value,
        consumption: 0, // Will be calculated by worker
        unit: 'm3',
      };
    } catch (error) {
      this.logger.error(`Default decode failed: ${error.message}`);
      return {
        value: 0,
        consumption: 0,
        unit: 'm3',
      };
    }
  }

  /**
   * Validate decoded result
   */
  private validateDecodedResult(result: any): DecodedReading {
    if (!result || typeof result !== 'object') {
      throw new Error('Decoder must return an object');
    }

    const decoded: DecodedReading = {
      value: typeof result.value === 'number' ? result.value : 0,
      consumption: typeof result.consumption === 'number' ? result.consumption : undefined,
      batteryLevel: typeof result.batteryLevel === 'number' ? result.batteryLevel : undefined,
      signalStrength: typeof result.signalStrength === 'number' ? result.signalStrength : undefined,
      temperature: typeof result.temperature === 'number' ? result.temperature : undefined,
      alarms: Array.isArray(result.alarms) ? result.alarms : undefined,
      unit: typeof result.unit === 'string' ? result.unit : 'm3',
      raw: result,
    };

    // Validate value range
    if (decoded.value < 0 || decoded.value > 999999999) {
      this.logger.warn(`Suspicious value: ${decoded.value}`);
    }

    return decoded;
  }

  /**
   * Cache decoder function in memory
   */
  private cacheDecoder(key: string, code: string): void {
    this.decoderCache.set(key, {
      fn: new Function('payload', code),
      expiresAt: Date.now() + CACHE_TTL.MEDIUM * 1000,
    });
  }

  /**
   * Clear decoder cache
   */
  clearCache(): void {
    this.decoderCache.clear();
    this.logger.log('Decoder cache cleared');
  }
}

