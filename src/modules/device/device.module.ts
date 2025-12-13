// =============================================================================
// Device Module - Assets (Meters), Devices (Communication Units), Profiles
// =============================================================================

import { Module } from '@nestjs/common';
import { MetersModule } from './meters/meters.module';
import { MeterProfilesModule } from './meter-profiles/meter-profiles.module';
import { DevicesModule } from './devices/devices.module';
import { DeviceProfilesModule } from './device-profiles/device-profiles.module';

@Module({
  imports: [MetersModule, MeterProfilesModule, DevicesModule, DeviceProfilesModule],
  exports: [MetersModule, MeterProfilesModule, DevicesModule, DeviceProfilesModule],
})
export class DeviceModule {}
