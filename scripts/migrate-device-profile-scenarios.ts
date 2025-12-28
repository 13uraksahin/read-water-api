// =============================================================================
// Migration Script: Convert Device Profile Configs to Scenario Format
// =============================================================================
// This script migrates existing device profiles that use the legacy single-decoder
// format to the new scenario-based format.
//
// Run: npx ts-node scripts/migrate-device-profile-scenarios.ts
// =============================================================================

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

interface LegacyCommunicationConfig {
  technology: string;
  fieldDefinitions: any[];
  decoderFunction?: string;
  testPayload?: string;
  scenarios?: any[]; // May already have scenarios if partially migrated
}

interface Scenario {
  id: string;
  name: string;
  isDefault: boolean;
  decoderFunction?: string;
  testPayload?: string;
  expectedBatteryMonths?: number;
  messageInterval?: number;
  description?: string;
}

interface NewCommunicationConfig {
  technology: string;
  fieldDefinitions: any[];
  scenarios: Scenario[];
}

async function migrateDeviceProfiles(): Promise<void> {
  console.log('Starting device profile scenario migration...\n');

  // Get all device profiles
  const profiles = await prisma.deviceProfile.findMany({
    select: {
      id: true,
      brand: true,
      modelCode: true,
      decoderFunction: true,
      testPayload: true,
      batteryLifeMonths: true,
      specifications: true,
    },
  });

  console.log(`Found ${profiles.length} device profiles to check.\n`);

  let migrated = 0;
  let skipped = 0;
  let alreadyMigrated = 0;

  for (const profile of profiles) {
    const specs = profile.specifications as Record<string, unknown> | null;
    const communicationConfigs = specs?.communicationConfigs as LegacyCommunicationConfig[] | undefined;

    // Skip if no communication configs
    if (!communicationConfigs || communicationConfigs.length === 0) {
      console.log(`  [SKIP] ${profile.brand} ${profile.modelCode}: No communication configs`);
      skipped++;
      continue;
    }

    // Check if already migrated (has scenarios)
    const hasScenarios = communicationConfigs.some(
      (config) => config.scenarios && Array.isArray(config.scenarios) && config.scenarios.length > 0
    );

    if (hasScenarios) {
      console.log(`  [SKIP] ${profile.brand} ${profile.modelCode}: Already has scenarios`);
      alreadyMigrated++;
      continue;
    }

    // Migrate each communication config to include scenarios
    const newCommunicationConfigs: NewCommunicationConfig[] = communicationConfigs.map((config) => {
      // Create a default scenario from the legacy decoder
      const defaultScenario: Scenario = {
        id: randomUUID(),
        name: 'Default',
        isDefault: true,
        decoderFunction: config.decoderFunction || profile.decoderFunction || undefined,
        testPayload: config.testPayload || profile.testPayload || undefined,
        expectedBatteryMonths: profile.batteryLifeMonths || undefined,
        messageInterval: undefined,
        description: 'Auto-migrated from legacy format',
      };

      return {
        technology: config.technology,
        fieldDefinitions: config.fieldDefinitions || [],
        scenarios: defaultScenario.decoderFunction ? [defaultScenario] : [],
      };
    });

    // Update the profile
    const updatedSpecs = {
      ...(specs || {}),
      communicationConfigs: newCommunicationConfigs,
    };
    
    await prisma.deviceProfile.update({
      where: { id: profile.id },
      data: {
        specifications: updatedSpecs as any,
      },
    });

    console.log(`  [MIGRATED] ${profile.brand} ${profile.modelCode}`);
    migrated++;
  }

  console.log('\n--- Migration Summary ---');
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Already migrated: ${alreadyMigrated}`);
  console.log(`  Skipped (no configs): ${skipped}`);
  console.log(`  Total: ${profiles.length}`);
}

async function migrateDevices(): Promise<void> {
  console.log('\n\nMigrating devices to use selected technology...\n');

  // Get all devices with their profiles
  const devices = await prisma.device.findMany({
    where: {
      selectedTechnology: null, // Only unmigrated devices
    },
    include: {
      deviceProfile: {
        select: {
          communicationTechnology: true,
          specifications: true,
        },
      },
    },
  });

  console.log(`Found ${devices.length} devices to migrate.\n`);

  let migrated = 0;

  for (const device of devices) {
    const specs = device.deviceProfile.specifications as Record<string, unknown> | null;
    const communicationConfigs = specs?.communicationConfigs as any[] | undefined;

    // Determine selected technology
    let selectedTechnology = device.deviceProfile.communicationTechnology;
    let activeScenarioIds: string[] = [];

    if (communicationConfigs && communicationConfigs.length > 0) {
      // Use first technology
      selectedTechnology = communicationConfigs[0].technology;

      // Select default scenarios
      const scenarios = communicationConfigs[0].scenarios || [];
      activeScenarioIds = scenarios
        .filter((s: any) => s.isDefault)
        .map((s: any) => s.id);
    }

    // Update device
    await prisma.device.update({
      where: { id: device.id },
      data: {
        selectedTechnology,
        activeScenarioIds,
      },
    });

    migrated++;
    process.stdout.write(`\r  Migrating devices: ${migrated}/${devices.length}`);
  }

  console.log(`\n\n  Migrated ${migrated} devices.`);
}

async function main(): Promise<void> {
  try {
    await migrateDeviceProfiles();
    await migrateDevices();
    console.log('\n\nMigration completed successfully!');
  } catch (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
