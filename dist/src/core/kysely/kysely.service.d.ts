import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely } from 'kysely';
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
export declare class KyselyService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private readonly db;
    private readonly pool;
    constructor(configService: ConfigService);
    getDb(): Kysely<Database>;
    getHourlyConsumption(meterId: string, startTime: Date, endTime: Date): Promise<{
        bucket: Date;
        total_consumption: number;
        avg_consumption: number;
        reading_count: number;
    }[]>;
    getDailyConsumptionByTenant(tenantId: string, startTime: Date, endTime: Date): Promise<{
        bucket: Date;
        total_consumption: number;
        meter_count: number;
    }[]>;
    getLatestReadingsForTenant(tenantId: string, limit?: number): Promise<{
        meter_id: string;
        serial_number: string;
        time: Date;
        value: number;
        consumption: number;
        signal_strength: number | null;
        battery_level: number | null;
    }[]>;
    getConsumptionStats(tenantId: string, startTime: Date, endTime: Date): Promise<{
        total_consumption: number;
        avg_consumption: number;
        max_consumption: number;
        min_consumption: number;
        reading_count: number;
        active_meters: number;
    }>;
    getHighConsumptionMeters(tenantId: string, thresholdMultiplier?: number, hours?: number): Promise<{
        meter_id: string;
        serial_number: string;
        recent_consumption: number;
        avg_consumption: number;
        ratio: number;
    }[]>;
    getDescendantTenants(parentPath: string): Promise<{
        id: string;
        path: string;
        name: string;
    }[]>;
    bulkInsertReadings(readings: Array<{
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
    }>): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export {};
