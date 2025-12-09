// =============================================================================
// Kysely Service - Advanced SQL Query Builder for TimescaleDB Analytics
// =============================================================================

import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';

// Database schema types for Kysely
interface Database {
  readings: ReadingsTable;
  meters: MetersTable;
  tenants: TenantsTable;
  customers: CustomersTable;
  alarms: AlarmsTable;
}

interface ReadingsTable {
  id: string;
  time: Date;
  tenant_id: string;
  meter_id: string;
  value: number;
  consumption: number;
  unit: string;
  signal_strength: number | null;
  battery_level: number | null;
  temperature: number | null;
  raw_payload: object | null;
  source: string | null;
  source_device_id: string | null;
  communication_technology: string | null;
  processed_at: Date | null;
  decoder_used: string | null;
}

interface MetersTable {
  id: string;
  created_at: Date;
  updated_at: Date;
  tenant_id: string;
  customer_id: string | null;
  meter_profile_id: string;
  serial_number: string;
  initial_index: number;
  installation_date: Date;
  status: string;
  valve_status: string;
  last_reading_value: number | null;
  last_reading_time: Date | null;
  last_signal_strength: number | null;
  last_battery_level: number | null;
  connectivity_config: object;
  address: object;
  address_code: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: object | null;
}

interface TenantsTable {
  id: string;
  created_at: Date;
  updated_at: Date;
  path: string;
  path_ltree: string;
  name: string;
  parent_id: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  tax_id: string | null;
  tax_office: string | null;
  address: object | null;
  latitude: number | null;
  longitude: number | null;
  subscription_status: string;
  subscription_plan: string | null;
  settings: object | null;
}

interface CustomersTable {
  id: string;
  created_at: Date;
  updated_at: Date;
  tenant_id: string;
  customerType: string;
  consumption_type: string;
  details: object;
  address: object;
  address_code: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: object | null;
}

interface AlarmsTable {
  id: string;
  created_at: Date;
  updated_at: Date;
  tenant_id: string;
  meter_id: string;
  type: string;
  status: string;
  severity: number;
  message: string | null;
  details: object | null;
  acknowledged_at: Date | null;
  acknowledged_by: string | null;
  resolved_at: Date | null;
  resolved_by: string | null;
  resolution: string | null;
}

@Injectable()
export class KyselyService implements OnModuleDestroy {
  private readonly logger = new Logger(KyselyService.name);
  private readonly db: Kysely<Database>;
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
      max: 10,
    });

    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: this.pool,
      }),
    });

    this.logger.log('Kysely query builder initialized');
  }

  /**
   * Get the Kysely database instance for custom queries
   */
  getDb(): Kysely<Database> {
    return this.db;
  }

  // ===========================================================================
  // TimescaleDB Specific Queries
  // ===========================================================================

  /**
   * Get hourly consumption aggregates for a meter
   */
  async getHourlyConsumption(
    meterId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const result = await sql<{
      bucket: Date;
      total_consumption: number;
      avg_consumption: number;
      reading_count: number;
    }>`
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

  /**
   * Get daily consumption aggregates for a tenant
   */
  async getDailyConsumptionByTenant(
    tenantId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const result = await sql<{
      bucket: Date;
      total_consumption: number;
      meter_count: number;
    }>`
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

  /**
   * Get the latest reading for each meter in a tenant
   */
  async getLatestReadingsForTenant(tenantId: string, limit = 100) {
    const result = await sql<{
      meter_id: string;
      serial_number: string;
      time: Date;
      value: number;
      consumption: number;
      signal_strength: number | null;
      battery_level: number | null;
    }>`
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

  /**
   * Get consumption statistics for a time period
   */
  async getConsumptionStats(
    tenantId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const result = await sql<{
      total_consumption: number;
      avg_consumption: number;
      max_consumption: number;
      min_consumption: number;
      reading_count: number;
      active_meters: number;
    }>`
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

  /**
   * Get meters with high consumption (anomaly detection)
   */
  async getHighConsumptionMeters(
    tenantId: string,
    thresholdMultiplier = 2,
    hours = 24,
  ) {
    const result = await sql<{
      meter_id: string;
      serial_number: string;
      recent_consumption: number;
      avg_consumption: number;
      ratio: number;
    }>`
      WITH recent AS (
        SELECT 
          meter_id,
          SUM(consumption) AS recent_consumption
        FROM readings
        WHERE tenant_id = ${tenantId}
          AND time >= NOW() - INTERVAL '${sql.raw(hours.toString())} hours'
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
            AND time < NOW() - INTERVAL '${sql.raw(hours.toString())} hours'
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

  /**
   * Get descendant tenants using ltree
   */
  async getDescendantTenants(parentPath: string) {
    const result = await sql<{
      id: string;
      path: string;
      name: string;
    }>`
      SELECT id, path, name
      FROM tenants
      WHERE path_ltree <@ ${parentPath}::ltree
      ORDER BY path
    `.execute(this.db);

    return result.rows;
  }

  /**
   * Bulk insert readings (optimized for TimescaleDB)
   */
  async bulkInsertReadings(
    readings: Array<{
      tenant_id: string;
      meter_id: string;
      time: Date;
      value: number;
      consumption: number;
      unit?: string;
      signal_strength?: number;
      battery_level?: number;
      temperature?: number;
      raw_payload?: object;
      source?: string;
      source_device_id?: string;
      communication_technology?: string;
      decoder_used?: string;
    }>,
  ) {
    if (readings.length === 0) return;

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
      .values(values as any)
      .execute();

    this.logger.debug(`Bulk inserted ${readings.length} readings`);
  }

  async onModuleDestroy() {
    this.logger.log('Closing Kysely connection pool...');
    await this.db.destroy();
    this.logger.log('Kysely connection pool closed');
  }
}

