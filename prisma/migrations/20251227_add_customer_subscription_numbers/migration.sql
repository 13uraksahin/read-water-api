-- Add customer_number column (nullable first)
ALTER TABLE "customers" ADD COLUMN "customer_number" TEXT;

-- Add subscription_number column (nullable first)
ALTER TABLE "subscriptions" ADD COLUMN "subscription_number" TEXT;

-- Generate customer_number for existing rows using tenant_id prefix and row_number
UPDATE "customers" c
SET "customer_number" = 'C-' || SUBSTRING(t.path FROM '[^.]+$') || '-' || LPAD(row_num::TEXT, 4, '0')
FROM (
    SELECT 
        id,
        tenant_id,
        ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) as row_num
    FROM "customers"
) sub
JOIN "tenants" t ON sub.tenant_id = t.id
WHERE c.id = sub.id;

-- Generate subscription_number for existing rows using tenant_id prefix and row_number
UPDATE "subscriptions" s
SET "subscription_number" = 'S-' || SUBSTRING(t.path FROM '[^.]+$') || '-' || LPAD(row_num::TEXT, 4, '0')
FROM (
    SELECT 
        id,
        tenant_id,
        ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at) as row_num
    FROM "subscriptions"
) sub
JOIN "tenants" t ON sub.tenant_id = t.id
WHERE s.id = sub.id;

-- Make customer_number NOT NULL
ALTER TABLE "customers" ALTER COLUMN "customer_number" SET NOT NULL;

-- Make subscription_number NOT NULL
ALTER TABLE "subscriptions" ALTER COLUMN "subscription_number" SET NOT NULL;

-- Add unique constraint on (tenant_id, customer_number)
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_customer_number_key" UNIQUE ("tenant_id", "customer_number");

-- Add unique constraint on (tenant_id, subscription_number)
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_subscription_number_key" UNIQUE ("tenant_id", "subscription_number");

-- Add index on customer_number
CREATE INDEX "customers_customer_number_idx" ON "customers"("customer_number");

-- Add index on subscription_number
CREATE INDEX "subscriptions_subscription_number_idx" ON "subscriptions"("subscription_number");
