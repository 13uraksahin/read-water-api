"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KyselyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const kysely_1 = require("kysely");
const pg_1 = require("pg");
let KyselyService = KyselyService_1 = class KyselyService {
    configService;
    logger = new common_1.Logger(KyselyService_1.name);
    db;
    pool;
    constructor(configService) {
        this.configService = configService;
        this.pool = new pg_1.Pool({
            connectionString: this.configService.get('DATABASE_URL'),
            max: 10,
        });
        this.db = new kysely_1.Kysely({
            dialect: new kysely_1.PostgresDialect({
                pool: this.pool,
            }),
        });
        this.logger.log('Kysely query builder initialized');
    }
    getDb() {
        return this.db;
    }
    async getHourlyConsumption(meterId, startTime, endTime) {
        const result = await (0, kysely_1.sql) `
      SELECT 
        time_bucket('1 hour', time) AS bucket,
        SUM(consumption) AS total_consumption,
        AVG(consumption) AS avg_consumption,
        COUNT(*) AS reading_count
      FROM readings
      WHERE meter_id = ${meterId}
        AND time >= ${startTime}
        AND time <= ${endTime}
      GROUP BY bucket
      ORDER BY bucket DESC
    `.execute(this.db);
        return result.rows;
    }
    async getDailyConsumptionByTenant(tenantId, startTime, endTime) {
        const result = await (0, kysely_1.sql) `
      SELECT 
        time_bucket('1 day', time) AS bucket,
        SUM(consumption) AS total_consumption,
        COUNT(DISTINCT meter_id) AS meter_count
      FROM readings
      WHERE tenant_id = ${tenantId}
        AND time >= ${startTime}
        AND time <= ${endTime}
      GROUP BY bucket
      ORDER BY bucket DESC
    `.execute(this.db);
        return result.rows;
    }
    async getLatestReadingsForTenant(tenantId, limit = 100) {
        const result = await (0, kysely_1.sql) `
      SELECT DISTINCT ON (r.meter_id)
        r.meter_id,
        m.serial_number,
        r.time,
        r.value,
        r.consumption,
        r.signal_strength,
        r.battery_level
      FROM readings r
      JOIN meters m ON r.meter_id = m.id
      WHERE r.tenant_id = ${tenantId}
      ORDER BY r.meter_id, r.time DESC
      LIMIT ${limit}
    `.execute(this.db);
        return result.rows;
    }
    async getConsumptionStats(tenantId, startTime, endTime) {
        const result = await (0, kysely_1.sql) `
      SELECT 
        COALESCE(SUM(consumption), 0) AS total_consumption,
        COALESCE(AVG(consumption), 0) AS avg_consumption,
        COALESCE(MAX(consumption), 0) AS max_consumption,
        COALESCE(MIN(consumption), 0) AS min_consumption,
        COUNT(*) AS reading_count,
        COUNT(DISTINCT meter_id) AS active_meters
      FROM readings
      WHERE tenant_id = ${tenantId}
        AND time >= ${startTime}
        AND time <= ${endTime}
    `.execute(this.db);
        return result.rows[0];
    }
    async getHighConsumptionMeters(tenantId, thresholdMultiplier = 2, hours = 24) {
        const result = await (0, kysely_1.sql) `
      WITH recent AS (
        SELECT 
          meter_id,
          SUM(consumption) AS recent_consumption
        FROM readings
        WHERE tenant_id = ${tenantId}
          AND time >= NOW() - INTERVAL '${kysely_1.sql.raw(hours.toString())} hours'
        GROUP BY meter_id
      ),
      historical AS (
        SELECT 
          meter_id,
          AVG(daily_consumption) AS avg_consumption
        FROM (
          SELECT 
            meter_id,
            time_bucket('1 day', time) AS day,
            SUM(consumption) AS daily_consumption
          FROM readings
          WHERE tenant_id = ${tenantId}
            AND time >= NOW() - INTERVAL '30 days'
            AND time < NOW() - INTERVAL '${kysely_1.sql.raw(hours.toString())} hours'
          GROUP BY meter_id, day
        ) daily
        GROUP BY meter_id
      )
      SELECT 
        r.meter_id,
        m.serial_number,
        r.recent_consumption,
        COALESCE(h.avg_consumption, 0) AS avg_consumption,
        CASE 
          WHEN COALESCE(h.avg_consumption, 0) > 0 
          THEN r.recent_consumption / h.avg_consumption 
          ELSE 0 
        END AS ratio
      FROM recent r
      JOIN meters m ON r.meter_id = m.id
      LEFT JOIN historical h ON r.meter_id = h.meter_id
      WHERE CASE 
        WHEN COALESCE(h.avg_consumption, 0) > 0 
        THEN r.recent_consumption / h.avg_consumption > ${thresholdMultiplier}
        ELSE FALSE 
      END
      ORDER BY ratio DESC
    `.execute(this.db);
        return result.rows;
    }
    async getDescendantTenants(parentPath) {
        const result = await (0, kysely_1.sql) `
      SELECT id, path, name
      FROM tenants
      WHERE path_ltree <@ ${parentPath}::ltree
      ORDER BY path
    `.execute(this.db);
        return result.rows;
    }
    async bulkInsertReadings(readings) {
        if (readings.length === 0)
            return;
        const values = readings.map((r) => ({
            tenant_id: r.tenant_id,
            meter_id: r.meter_id,
            time: r.time,
            value: r.value,
            consumption: r.consumption,
            unit: r.unit || 'm3',
            signal_strength: r.signal_strength ?? null,
            battery_level: r.battery_level ?? null,
            temperature: r.temperature ?? null,
            raw_payload: r.raw_payload ? JSON.stringify(r.raw_payload) : null,
            source: r.source ?? null,
            source_device_id: r.source_device_id ?? null,
            communication_technology: r.communication_technology ?? null,
            processed_at: new Date(),
            decoder_used: r.decoder_used ?? null,
        }));
        await this.db
            .insertInto('readings')
            .values(values)
            .execute();
        this.logger.debug(`Bulk inserted ${readings.length} readings`);
    }
    async onModuleDestroy() {
        this.logger.log('Closing Kysely connection pool...');
        await this.db.destroy();
        this.logger.log('Kysely connection pool closed');
    }
};
exports.KyselyService = KyselyService;
exports.KyselyService = KyselyService = KyselyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KyselyService);
//# sourceMappingURL=kysely.service.js.map