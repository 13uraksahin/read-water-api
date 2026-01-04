// =============================================================================
// Assets Module - Physical Assets and Communication Modules
// =============================================================================
// This module aggregates all asset-related functionality:
// - Meters: Physical water meters (assets)
// - Meter Profiles: Meter specifications
// - Modules: Communication units (IoT modules)
// - Module Profiles: Communication module specifications
// =============================================================================

import { Module } from '@nestjs/common';
import { MetersModule } from './meters/meters.module';
import { MeterProfilesModule } from './meter-profiles/meter-profiles.module';
import { ModulesModule } from './modules/modules.module';
import { ModuleProfilesModule } from './module-profiles/module-profiles.module';

@Module({
  imports: [MetersModule, MeterProfilesModule, ModulesModule, ModuleProfilesModule],
  exports: [MetersModule, MeterProfilesModule, ModulesModule, ModuleProfilesModule],
})
export class AssetsModule {}
