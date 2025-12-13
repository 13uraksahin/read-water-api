// =============================================================================
// Device Profiles Module
// =============================================================================
// Also includes DecodersController (read-only view of decoders from DeviceProfiles)
// =============================================================================

import { Module } from '@nestjs/common';
import { DeviceProfilesController, DecodersController } from './device-profiles.controller';
import { DeviceProfilesService } from './device-profiles.service';

@Module({
  controllers: [DeviceProfilesController, DecodersController],
  providers: [DeviceProfilesService],
  exports: [DeviceProfilesService],
})
export class DeviceProfilesModule {}
