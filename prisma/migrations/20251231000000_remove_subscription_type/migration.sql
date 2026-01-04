-- =============================================================================
-- Remove SubscriptionType from Subscriptions
-- =============================================================================
-- This migration removes the subscriptionType field from subscriptions
-- as per business requirement change - subscriptions no longer need a type.
-- =============================================================================

-- Drop the index on subscription_type
DROP INDEX IF EXISTS "subscriptions_subscription_type_idx";

-- Drop the column subscription_type from subscriptions table
ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "subscription_type";

-- Drop the SubscriptionType enum type
DROP TYPE IF EXISTS "SubscriptionType";
