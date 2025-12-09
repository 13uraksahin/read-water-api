// =============================================================================
// Device Module - Meters and Profiles
// =============================================================================

import { Module } from '@nestjs/common';
import { MetersModule } from './meters/meters.module';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [MetersModule, ProfilesModule],
  exports: [MetersModule, ProfilesModule],
})
export class DeviceModule {}

