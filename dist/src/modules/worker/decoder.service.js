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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DecoderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const redis_service_1 = require("../../core/redis/redis.service");
const constants_1 = require("../../common/constants");
const vm = __importStar(require("vm"));
let DecoderService = DecoderService_1 = class DecoderService {
    prisma;
    redisService;
    logger = new common_1.Logger(DecoderService_1.name);
    decoderCache = new Map();
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async decode(deviceProfileId, payload) {
        const decoder = await this.getDecoderFunction(deviceProfileId);
        if (!decoder) {
            this.logger.warn(`No decoder found for device profile ${deviceProfileId}`);
            return this.defaultDecode(payload);
        }
        try {
            const result = await this.executeDecoder(decoder, payload);
            return this.validateDecodedResult(result);
        }
        catch (error) {
            this.logger.error(`Decoder execution failed: ${error.message}`);
            return this.defaultDecode(payload);
        }
    }
    async decodeWithFunction(decoderCode, payload) {
        if (!decoderCode) {
            return this.defaultDecode(payload);
        }
        try {
            const result = await this.executeDecoder(decoderCode, payload);
            return this.validateDecodedResult(result);
        }
        catch (error) {
            this.logger.error(`Decoder execution failed: ${error.message}`);
            return this.defaultDecode(payload);
        }
    }
    async getDecoderFunction(deviceProfileId) {
        const cacheKey = deviceProfileId;
        const cached = this.decoderCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.fn.toString();
        }
        const redisKey = constants_1.CACHE_KEYS.DECODER_FUNCTION(deviceProfileId);
        const redisValue = await this.redisService.get(redisKey);
        if (redisValue) {
            this.cacheDecoder(cacheKey, redisValue);
            return redisValue;
        }
        const deviceProfile = await this.prisma.deviceProfile.findUnique({
            where: { id: deviceProfileId },
            select: { decoderFunction: true },
        });
        if (!deviceProfile || !deviceProfile.decoderFunction) {
            return null;
        }
        await this.redisService.set(redisKey, deviceProfile.decoderFunction, constants_1.CACHE_TTL.MEDIUM);
        this.cacheDecoder(cacheKey, deviceProfile.decoderFunction);
        return deviceProfile.decoderFunction;
    }
    async executeDecoder(decoderCode, payload) {
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
                log: (...args) => this.logger.debug('Decoder:', ...args),
                warn: (...args) => this.logger.warn('Decoder:', ...args),
                error: (...args) => this.logger.error('Decoder:', ...args),
            },
            payload: payload,
            result: null,
        };
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
            const context = vm.createContext(sandbox);
            vm.runInContext(wrappedCode, context, {
                timeout: 1000,
                displayErrors: true,
            });
            return sandbox.result;
        }
        catch (error) {
            this.logger.error(`VM execution error: ${error.message}`);
            throw error;
        }
    }
    defaultDecode(payload) {
        try {
            const bytes = Buffer.from(payload, 'hex');
            let value = 0;
            if (bytes.length >= 4) {
                value = bytes.readUInt32BE(0) / 1000;
            }
            else if (bytes.length >= 2) {
                value = bytes.readUInt16BE(0) / 100;
            }
            else if (bytes.length >= 1) {
                value = bytes.readUInt8(0);
            }
            return {
                value,
                consumption: 0,
                unit: 'm3',
            };
        }
        catch (error) {
            this.logger.error(`Default decode failed: ${error.message}`);
            return {
                value: 0,
                consumption: 0,
                unit: 'm3',
            };
        }
    }
    validateDecodedResult(result) {
        if (!result || typeof result !== 'object') {
            throw new Error('Decoder must return an object');
        }
        const decoded = {
            value: typeof result.value === 'number' ? result.value : 0,
            consumption: typeof result.consumption === 'number' ? result.consumption : undefined,
            batteryLevel: typeof result.batteryLevel === 'number' ? result.batteryLevel : undefined,
            signalStrength: typeof result.signalStrength === 'number' ? result.signalStrength : undefined,
            temperature: typeof result.temperature === 'number' ? result.temperature : undefined,
            alarms: Array.isArray(result.alarms) ? result.alarms : undefined,
            unit: typeof result.unit === 'string' ? result.unit : 'm3',
            raw: result,
        };
        if (decoded.value < 0 || decoded.value > 999999999) {
            this.logger.warn(`Suspicious value: ${decoded.value}`);
        }
        return decoded;
    }
    cacheDecoder(key, code) {
        this.decoderCache.set(key, {
            fn: new Function('payload', code),
            expiresAt: Date.now() + constants_1.CACHE_TTL.MEDIUM * 1000,
        });
    }
    clearCache() {
        this.decoderCache.clear();
        this.logger.log('Decoder cache cleared');
    }
};
exports.DecoderService = DecoderService;
exports.DecoderService = DecoderService = DecoderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], DecoderService);
//# sourceMappingURL=decoder.service.js.map