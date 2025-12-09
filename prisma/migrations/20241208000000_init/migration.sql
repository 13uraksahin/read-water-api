-- =============================================================================
-- Read Water - Initial Migration
-- =============================================================================
-- High-performance, multi-tenant water meter reading platform
-- PostgreSQL with TimescaleDB (time-series) and ltree (hierarchical tenancy)
-- =============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "ltree";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "MeterType" AS ENUM ('SINGLE_JET', 'MULTI_JET', 'WOLTMAN_PARALEL', 'WOLTMAN_VERTICAL', 'VOLUMETRIC', 'ULTRASONIC', 'ELECTROMAGNETIC', 'COMPOUND', 'IRRIGATION');

-- CreateEnum
CREATE TYPE "DialType" AS ENUM ('SEMI_DRY', 'DRY', 'SUPER_DRY', 'WET');

-- CreateEnum
CREATE TYPE "TemperatureType" AS ENUM ('T30', 'T90');

-- CreateEnum
CREATE TYPE "MountingType" AS ENUM ('VERTICAL', 'HORIZONTAL', 'BOTH');

-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('THREAD', 'FLANGE');

-- CreateEnum
CREATE TYPE "CommunicationModule" AS ENUM ('INTEGRATED', 'RETROFIT', 'NONE');

-- CreateEnum
CREATE TYPE "Brand" AS ENUM ('BAYLAN', 'MANAS', 'KLEPSAN', 'CEM', 'ZENNER', 'TURKOGLU', 'BEREKET', 'TEKSAN');

-- CreateEnum
CREATE TYPE "CommunicationTechnology" AS ENUM ('SIGFOX', 'LORAWAN', 'NB_IOT', 'WM_BUS', 'MIOTY', 'WIFI', 'BLUETOOTH', 'NFC', 'OMS');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('HTTP', 'MQTT', 'API');

-- CreateEnum
CREATE TYPE "ConsumptionType" AS ENUM ('NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'ORGANIZATIONAL');

-- CreateEnum
CREATE TYPE "MeterStatus" AS ENUM ('ACTIVE', 'PASSIVE', 'WAREHOUSE', 'MAINTENANCE', 'PLANNED', 'DEPLOYED');

-- CreateEnum
CREATE TYPE "IPRating" AS ENUM ('IP54', 'IP65', 'IP67', 'IP68');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('PLATFORM_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'VIEWER', 'FIELD_ENGINEER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "AlarmType" AS ENUM ('TAMPER', 'LOW_BATTERY', 'TILT', 'REVERSE_FLOW', 'HIGH_USAGE', 'NO_SIGNAL', 'VALVE_ERROR', 'COMMUNICATION_ERROR');

-- CreateEnum
CREATE TYPE "AlarmStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PASSIVE', 'TRIAL', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ValveStatus" AS ENUM ('OPEN', 'CLOSED', 'UNKNOWN', 'NOT_APPLICABLE');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "contact_first_name" TEXT,
    "contact_last_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "tax_id" TEXT,
    "tax_office" TEXT,
    "address" JSONB,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "subscription_plan" TEXT,
    "settings" JSONB,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "tc_id_no" TEXT,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "avatar_url" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "metadata" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" "SystemRole" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "user_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customerType" "CustomerType" NOT NULL,
    "consumption_type" "ConsumptionType" NOT NULL DEFAULT 'NORMAL',
    "details" JSONB NOT NULL,
    "address" JSONB NOT NULL,
    "address_code" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "metadata" JSONB,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meter_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "brand" "Brand" NOT NULL,
    "model_code" TEXT NOT NULL,
    "meter_type" "MeterType" NOT NULL,
    "dial_type" "DialType" NOT NULL,
    "connection_type" "ConnectionType" NOT NULL,
    "mounting_type" "MountingType" NOT NULL,
    "temperature_type" "TemperatureType" NOT NULL,
    "diameter" INTEGER,
    "length" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "q1" DECIMAL(10,4),
    "q2" DECIMAL(10,4),
    "q3" DECIMAL(10,4),
    "q4" DECIMAL(10,4),
    "r_value" DECIMAL(10,2),
    "pressure_loss" DECIMAL(10,4),
    "ip_rating" "IPRating",
    "communication_module" "CommunicationModule" NOT NULL DEFAULT 'NONE',
    "battery_life_months" INTEGER,
    "communication_configs" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "specifications" JSONB,

    CONSTRAINT "meter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID,
    "meter_profile_id" UUID NOT NULL,
    "serial_number" TEXT NOT NULL,
    "initial_index" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "installation_date" TIMESTAMP(3) NOT NULL,
    "status" "MeterStatus" NOT NULL DEFAULT 'WAREHOUSE',
    "valve_status" "ValveStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "last_reading_value" DECIMAL(15,3),
    "last_reading_time" TIMESTAMP(3),
    "last_signal_strength" INTEGER,
    "last_battery_level" INTEGER,
    "connectivity_config" JSONB NOT NULL DEFAULT '{}',
    "address" JSONB NOT NULL,
    "address_code" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "metadata" JSONB,

    CONSTRAINT "meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Readings (Will be converted to TimescaleDB hypertable)
CREATE TABLE "readings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" UUID NOT NULL,
    "meter_id" UUID NOT NULL,
    "value" DECIMAL(15,3) NOT NULL,
    "consumption" DECIMAL(15,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'm3',
    "signal_strength" INTEGER,
    "battery_level" INTEGER,
    "temperature" DECIMAL(5,2),
    "raw_payload" JSONB,
    "source" TEXT,
    "source_device_id" TEXT,
    "communication_technology" "CommunicationTechnology",
    "processed_at" TIMESTAMPTZ,
    "decoder_used" TEXT,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id", "time")
);

-- CreateTable
CREATE TABLE "alarms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "meter_id" UUID NOT NULL,
    "type" "AlarmType" NOT NULL,
    "status" "AlarmStatus" NOT NULL DEFAULT 'ACTIVE',
    "severity" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "details" JSONB,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,
    "resolution" TEXT,

    CONSTRAINT "alarms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decoder_functions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "communication_technology" "CommunicationTechnology" NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "test_payload" TEXT,
    "expected_output" JSONB,
    "last_tested_at" TIMESTAMP(3),
    "last_test_succeeded" BOOLEAN,
    "metadata" JSONB,

    CONSTRAINT "decoder_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_tech_field_defs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "technology" "CommunicationTechnology" NOT NULL,
    "fields" JSONB NOT NULL,
    "integration_types" "IntegrationType"[] DEFAULT ARRAY[]::"IntegrationType"[],

    CONSTRAINT "communication_tech_field_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Many-to-Many for Tenant Allowed Profiles
CREATE TABLE "_TenantAllowedProfiles" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_TenantAllowedProfiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- =============================================================================
-- TIMESCALEDB HYPERTABLE
-- =============================================================================
-- Convert readings table to a TimescaleDB hypertable for optimized time-series queries
-- Partitioned by 'time' column with 7-day chunks (optimal for IoT data)
SELECT create_hypertable('readings', 'time', chunk_time_interval => INTERVAL '7 days', if_not_exists => TRUE);

-- Enable compression for old data (data older than 30 days will be compressed)
ALTER TABLE readings SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'meter_id, tenant_id'
);

-- Add compression policy: compress chunks older than 30 days
SELECT add_compression_policy('readings', INTERVAL '30 days', if_not_exists => TRUE);

-- =============================================================================
-- LTREE INDEXES FOR HIERARCHICAL TENANT QUERIES
-- =============================================================================
-- Add ltree column for efficient hierarchical queries (stored as text in Prisma, but indexed as ltree)
ALTER TABLE "tenants" ADD COLUMN "path_ltree" ltree;

-- Create trigger to auto-sync path to path_ltree
CREATE OR REPLACE FUNCTION sync_tenant_path_ltree()
RETURNS TRIGGER AS $$
BEGIN
    NEW.path_ltree := NEW.path::ltree;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_path_ltree_sync
    BEFORE INSERT OR UPDATE OF path ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION sync_tenant_path_ltree();

-- GiST index for ltree queries (ancestor/descendant lookups)
CREATE INDEX "tenants_path_ltree_gist_idx" ON "tenants" USING GIST ("path_ltree");

-- B-tree index for exact ltree lookups
CREATE INDEX "tenants_path_ltree_btree_idx" ON "tenants" USING BTREE ("path_ltree");

-- =============================================================================
-- STANDARD INDEXES
-- =============================================================================

-- CreateIndex
CREATE UNIQUE INDEX "tenants_path_key" ON "tenants"("path");

-- CreateIndex
CREATE INDEX "tenants_path_idx" ON "tenants"("path");

-- CreateIndex
CREATE INDEX "tenants_parent_id_idx" ON "tenants"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_tenants_tenant_id_idx" ON "user_tenants"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tenants_user_id_tenant_id_key" ON "user_tenants"("user_id", "tenant_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- CreateIndex
CREATE INDEX "customers_customerType_idx" ON "customers"("customerType");

-- CreateIndex
CREATE INDEX "meter_profiles_brand_idx" ON "meter_profiles"("brand");

-- CreateIndex
CREATE INDEX "meter_profiles_meter_type_idx" ON "meter_profiles"("meter_type");

-- CreateIndex
CREATE UNIQUE INDEX "meter_profiles_brand_model_code_key" ON "meter_profiles"("brand", "model_code");

-- CreateIndex
CREATE UNIQUE INDEX "meters_serial_number_key" ON "meters"("serial_number");

-- CreateIndex
CREATE INDEX "meters_tenant_id_idx" ON "meters"("tenant_id");

-- CreateIndex
CREATE INDEX "meters_customer_id_idx" ON "meters"("customer_id");

-- CreateIndex
CREATE INDEX "meters_status_idx" ON "meters"("status");

-- CreateIndex
CREATE INDEX "meters_serial_number_idx" ON "meters"("serial_number");

-- CreateIndex: Time-based indexes for readings (optimized for TimescaleDB)
CREATE INDEX "readings_time_idx" ON "readings"("time" DESC);

-- CreateIndex
CREATE INDEX "readings_meter_id_time_idx" ON "readings"("meter_id", "time" DESC);

-- CreateIndex
CREATE INDEX "readings_tenant_id_time_idx" ON "readings"("tenant_id", "time" DESC);

-- CreateIndex
CREATE INDEX "alarms_tenant_id_idx" ON "alarms"("tenant_id");

-- CreateIndex
CREATE INDEX "alarms_meter_id_idx" ON "alarms"("meter_id");

-- CreateIndex
CREATE INDEX "alarms_status_idx" ON "alarms"("status");

-- CreateIndex
CREATE INDEX "alarms_created_at_idx" ON "alarms"("created_at");

-- CreateIndex
CREATE INDEX "settings_category_idx" ON "settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "settings_tenant_id_key_key" ON "settings"("tenant_id", "key");

-- CreateIndex
CREATE INDEX "decoder_functions_communication_technology_idx" ON "decoder_functions"("communication_technology");

-- CreateIndex
CREATE INDEX "decoder_functions_is_active_idx" ON "decoder_functions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "communication_tech_field_defs_technology_key" ON "communication_tech_field_defs"("technology");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "_TenantAllowedProfiles_B_index" ON "_TenantAllowedProfiles"("B");

-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meters" ADD CONSTRAINT "meters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meters" ADD CONSTRAINT "meters_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meters" ADD CONSTRAINT "meters_meter_profile_id_fkey" FOREIGN KEY ("meter_profile_id") REFERENCES "meter_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Note - No FK for readings to avoid issues with TimescaleDB hypertable
-- Readings references are handled at application level

-- AddForeignKey
ALTER TABLE "alarms" ADD CONSTRAINT "alarms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarms" ADD CONSTRAINT "alarms_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TenantAllowedProfiles" ADD CONSTRAINT "_TenantAllowedProfiles_A_fkey" FOREIGN KEY ("A") REFERENCES "meter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TenantAllowedProfiles" ADD CONSTRAINT "_TenantAllowedProfiles_B_fkey" FOREIGN KEY ("B") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- HELPER FUNCTIONS FOR LTREE QUERIES
-- =============================================================================

-- Function to get all descendant tenants
CREATE OR REPLACE FUNCTION get_descendant_tenants(parent_path TEXT)
RETURNS TABLE(id UUID, path TEXT, name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.path, t.name
    FROM tenants t
    WHERE t.path_ltree <@ parent_path::ltree;
END;
$$ LANGUAGE plpgsql;

-- Function to get all ancestor tenants
CREATE OR REPLACE FUNCTION get_ancestor_tenants(child_path TEXT)
RETURNS TABLE(id UUID, path TEXT, name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.path, t.name
    FROM tenants t
    WHERE t.path_ltree @> child_path::ltree;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has access to tenant (based on hierarchy)
CREATE OR REPLACE FUNCTION user_has_tenant_access(user_uuid UUID, target_tenant_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tenant_path TEXT;
BEGIN
    -- Get user's tenant path (use the highest level tenant they belong to)
    SELECT t.path INTO user_tenant_path
    FROM user_tenants ut
    JOIN tenants t ON ut.tenant_id = t.id
    WHERE ut.user_id = user_uuid
    AND target_tenant_path::ltree <@ t.path_ltree
    LIMIT 1;
    
    RETURN user_tenant_path IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

