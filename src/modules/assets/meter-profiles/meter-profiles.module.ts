// =============================================================================
// Meter Profiles Module
// =============================================================================

import { Module } from '@nestjs/common';
import { MeterProfilesService } from './meter-profiles.service';
import { MeterProfilesController } from './meter-profiles.controller';

@Module({
  controllers: [MeterProfilesController],
  providers: [MeterProfilesService],
  exports: [MeterProfilesService],
})
export class MeterProfilesModule {}

