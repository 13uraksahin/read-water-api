-- =============================================================================
-- Read Water - Subscription Model Migration
-- =============================================================================
-- This migration introduces the Subscription model as the central linking entity
-- between Customers and Meters.
--
-- Key Changes:
-- 1. Add SubscriptionType and SubscriptionGroup enums
-- 2. Add TenantSubscriptionStatus enum (renamed from SubscriptionStatus)
-- 3. Add INODYA to DeviceBrand enum
-- 4. Add USED to MeterStatus and DeviceStatus enums
-- 5. Create Subscription table
-- 6. Add subscriptionId to Meters (replacing customerId)
-- 7. Remove address fields from Customers (now on Subscription)
-- 8. Remove consumptionType from Customers (now subscriptionGroup on Subscription)
-- =============================================================================

-- =============================================================================
-- NEW ENUMS
-- =============================================================================

-- CreateEnum: SubscriptionType
CREATE TYPE "SubscriptionType" AS ENUM ('INDIVIDUAL', 'ORGANIZATIONAL');

-- CreateEnum: SubscriptionGroup
CREATE TYPE "SubscriptionGroup" AS ENUM ('NORMAL_CONSUMPTION', 'HIGH_CONSUMPTION');

-- CreateEnum: TenantSubscriptionStatus (rename from SubscriptionStatus to avoid confusion)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TenantSubscriptionStatus') THEN
        CREATE TYPE "TenantSubscriptionStatus" AS ENUM ('ACTIVE', 'PASSIVE', 'TRIAL', 'SUSPENDED');
    END IF;
END $$;

-- =============================================================================
-- ENUM UPDATES
-- =============================================================================
-- Note: MeterStatus.USED, DeviceStatus.USED, and DeviceBrand.INODYA are now 
-- created in the init migration, so no alterations needed here.

-- =============================================================================
-- CREATE SUBSCRIPTIONS TABLE
-- =============================================================================

CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "subscription_type" "SubscriptionType" NOT NULL,
    "subscription_group" "SubscriptionGroup" NOT NULL DEFAULT 'NORMAL_CONSUMPTION',
    "address" JSONB NOT NULL,
    "address_code" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- ADD SUBSCRIPTION RELATION TO METERS
-- =============================================================================

-- Add subscription_id column to meters
ALTER TABLE "meters" ADD COLUMN "subscription_id" UUID;

-- =============================================================================
-- MIGRATE DATA: Create subscriptions from existing meter-customer relationships
-- =============================================================================

-- Step 1: Create subscriptions for existing meters that have customers
INSERT INTO "subscriptions" (
    "id",
    "created_at",
    "updated_at",
    "tenant_id",
    "customer_id",
    "subscription_type",
    "subscription_group",
    "address",
    "address_code",
    "latitude",
    "longitude",
    "is_active",
    "start_date",
    "metadata"
)
SELECT
    gen_random_uuid(),
    COALESCE(m.created_at, NOW()),
    NOW(),
    m.tenant_id,
    m.customer_id,
    c."customerType"::text::"SubscriptionType",
    COALESCE(c.consumption_type::text::"SubscriptionGroup", 'NORMAL_CONSUMPTION'),
    COALESCE(m.address, c.address, '{}'),
    COALESCE(m.address_code, c.address_code),
    COALESCE(m.latitude, c.latitude),
    COALESCE(m.longitude, c.longitude),
    CASE WHEN m.status IN ('ACTIVE', 'DEPLOYED') THEN true ELSE false END,
    COALESCE(m.installation_date, m.created_at, NOW()),
    m.metadata
FROM "meters" m
JOIN "customers" c ON m.customer_id = c.id
WHERE m.customer_id IS NOT NULL;

-- Step 2: Update meters with their corresponding subscription_id
UPDATE "meters" m
SET subscription_id = s.id
FROM "subscriptions" s
WHERE s.customer_id = m.customer_id
AND s.tenant_id = m.tenant_id;

-- =============================================================================
-- MODIFY CUSTOMERS TABLE: Remove address-related fields
-- =============================================================================

-- Remove columns that are now on Subscription
ALTER TABLE "customers" DROP COLUMN IF EXISTS "address";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "address_code";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "longitude";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "consumption_type";

-- Rename customerType to customer_type for consistency
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'customerType') THEN
        ALTER TABLE "customers" RENAME COLUMN "customerType" TO "customer_type";
    END IF;
END $$;

-- =============================================================================
-- MODIFY METERS TABLE: Remove old address columns and customer_id
-- =============================================================================

-- Remove address columns (now inherited from Subscription)
ALTER TABLE "meters" DROP COLUMN IF EXISTS "address";
ALTER TABLE "meters" DROP COLUMN IF EXISTS "address_code";
ALTER TABLE "meters" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "meters" DROP COLUMN IF EXISTS "longitude";
ALTER TABLE "meters" DROP COLUMN IF EXISTS "connectivity_config";

-- Remove signal/battery from meters (now on device)
ALTER TABLE "meters" DROP COLUMN IF EXISTS "last_signal_strength";
ALTER TABLE "meters" DROP COLUMN IF EXISTS "last_battery_level";

-- Remove customer_id (replaced by subscription_id)
ALTER TABLE "meters" DROP CONSTRAINT IF EXISTS "meters_customer_id_fkey";
DROP INDEX IF EXISTS "meters_customer_id_idx";
ALTER TABLE "meters" DROP COLUMN IF EXISTS "customer_id";

-- =============================================================================
-- MODIFY TENANTS TABLE: Rename subscription_status column
-- =============================================================================

-- Rename the column to avoid confusion with service subscriptions
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'subscription_status') THEN
        -- First drop the default
        ALTER TABLE "tenants" ALTER COLUMN "subscription_status" DROP DEFAULT;
        -- Rename the column
        ALTER TABLE "tenants" RENAME COLUMN "subscription_status" TO "tenant_subscription_status";
        -- Update the column type
        ALTER TABLE "tenants" 
            ALTER COLUMN "tenant_subscription_status" TYPE "TenantSubscriptionStatus" 
            USING "tenant_subscription_status"::text::"TenantSubscriptionStatus";
        -- Re-add the default
        ALTER TABLE "tenants" ALTER COLUMN "tenant_subscription_status" SET DEFAULT 'TRIAL'::"TenantSubscriptionStatus";
    END IF;
END $$;

-- =============================================================================
-- INDEXES FOR SUBSCRIPTIONS
-- =============================================================================

CREATE INDEX "subscriptions_tenant_id_idx" ON "subscriptions"("tenant_id");
CREATE INDEX "subscriptions_customer_id_idx" ON "subscriptions"("customer_id");
CREATE INDEX "subscriptions_is_active_idx" ON "subscriptions"("is_active");
CREATE INDEX "subscriptions_subscription_type_idx" ON "subscriptions"("subscription_type");

-- =============================================================================
-- INDEX FOR METERS SUBSCRIPTION
-- =============================================================================

CREATE INDEX "meters_subscription_id_idx" ON "meters"("subscription_id");

-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================

-- AddForeignKey: subscriptions -> tenants
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" 
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: subscriptions -> customers
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" 
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: meters -> subscriptions
ALTER TABLE "meters" ADD CONSTRAINT "meters_subscription_id_fkey" 
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- UPDATE CUSTOMER INDEX
-- =============================================================================

-- Drop old customerType index and create new customer_type index
DROP INDEX IF EXISTS "customers_customerType_idx";
CREATE INDEX "customers_customer_type_idx" ON "customers"("customer_type");

-- =============================================================================
-- CLEANUP: Drop old types if they exist and are unused
-- =============================================================================

-- Keep ConsumptionType for backwards compatibility but it's no longer used in the schema
-- We'll leave it for now in case there are views or other dependencies

-- =============================================================================
-- HELPER FUNCTION: Get subscription address for a meter
-- =============================================================================

CREATE OR REPLACE FUNCTION get_meter_address(meter_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT s.address INTO result
    FROM meters m
    JOIN subscriptions s ON m.subscription_id = s.id
    WHERE m.id = meter_uuid;
    
    RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- HELPER FUNCTION: Get subscription location for a meter
-- =============================================================================

CREATE OR REPLACE FUNCTION get_meter_location(meter_uuid UUID)
RETURNS TABLE(latitude DECIMAL, longitude DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT s.latitude, s.longitude
    FROM meters m
    JOIN subscriptions s ON m.subscription_id = s.id
    WHERE m.id = meter_uuid;
END;
$$ LANGUAGE plpgsql;

