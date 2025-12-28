"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient({
    log: ['warn', 'error'],
});
async function migrateDeviceProfiles() {
    console.log('Starting device profile scenario migration...\n');
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
        const specs = profile.specifications;
        const communicationConfigs = specs?.communicationConfigs;
        if (!communicationConfigs || communicationConfigs.length === 0) {
            console.log(`  [SKIP] ${profile.brand} ${profile.modelCode}: No communication configs`);
            skipped++;
            continue;
        }
        const hasScenarios = communicationConfigs.some((config) => config.scenarios && Array.isArray(config.scenarios) && config.scenarios.length > 0);
        if (hasScenarios) {
            console.log(`  [SKIP] ${profile.brand} ${profile.modelCode}: Already has scenarios`);
            alreadyMigrated++;
            continue;
        }
        const newCommunicationConfigs = communicationConfigs.map((config) => {
            const defaultScenario = {
                id: (0, crypto_1.randomUUID)(),
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
        const updatedSpecs = {
            ...(specs || {}),
            communicationConfigs: newCommunicationConfigs,
        };
        await prisma.deviceProfile.update({
            where: { id: profile.id },
            data: {
                specifications: updatedSpecs,
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
async function migrateDevices() {
    console.log('\n\nMigrating devices to use selected technology...\n');
    const devices = await prisma.device.findMany({
        where: {
            selectedTechnology: null,
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
        const specs = device.deviceProfile.specifications;
        const communicationConfigs = specs?.communicationConfigs;
        let selectedTechnology = device.deviceProfile.communicationTechnology;
        let activeScenarioIds = [];
        if (communicationConfigs && communicationConfigs.length > 0) {
            selectedTechnology = communicationConfigs[0].technology;
            const scenarios = communicationConfigs[0].scenarios || [];
            activeScenarioIds = scenarios
                .filter((s) => s.isDefault)
                .map((s) => s.id);
        }
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
async function main() {
    try {
        await migrateDeviceProfiles();
        await migrateDevices();
        console.log('\n\nMigration completed successfully!');
    }
    catch (error) {
        console.error('\nMigration failed:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=migrate-device-profile-scenarios.js.map