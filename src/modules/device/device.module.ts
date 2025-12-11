// =============================================================================
// Device Module - Assets (Meters), Devices (Communication Units), Profiles
// =============================================================================

import { Module } from '@nestjs/common';
import { MetersModule } from './meters/meters.module';
import { ProfilesModule } from './profiles/profiles.module';
import { DevicesModule } from './devices/devices.module';
import { DeviceProfilesModule } from './device-profiles/device-profiles.module';

@Module({
  imports: [MetersModule, ProfilesModule, DevicesModule, DeviceProfilesModule],
  exports: [MetersModule, ProfilesModule, DevicesModule, DeviceProfilesModule],
})
export class DeviceModule {}
