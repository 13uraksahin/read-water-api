/*
  Warnings:

  - You are about to drop the column `battery_life_months` on the `meter_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `communication_configs` on the `meter_profiles` table. All the data in the column will be lost.
  - The `source_device_id` column on the `readings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `path_ltree` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the `decoder_functions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "tenants_path_ltree_btree_idx";

-- DropIndex
DROP INDEX "tenants_path_ltree_gist_idx";

-- AlterTable
ALTER TABLE "meter_profiles" DROP COLUMN "battery_life_months",
DROP COLUMN "communication_configs";

-- AlterTable
ALTER TABLE "readings" DROP COLUMN "source_device_id",
ADD COLUMN     "source_device_id" UUID;

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "path_ltree";

-- DropTable
DROP TABLE "decoder_functions";

-- DropEnum
DROP TYPE "ConsumptionType";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- CreateTable
CREATE TABLE "_TenantAllowedDeviceProfiles" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_TenantAllowedDeviceProfiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TenantAllowedDeviceProfiles_B_index" ON "_TenantAllowedDeviceProfiles"("B");

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_TenantAllowedDeviceProfiles" ADD CONSTRAINT "_TenantAllowedDeviceProfiles_A_fkey" FOREIGN KEY ("A") REFERENCES "device_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TenantAllowedDeviceProfiles" ADD CONSTRAINT "_TenantAllowedDeviceProfiles_B_fkey" FOREIGN KEY ("B") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
