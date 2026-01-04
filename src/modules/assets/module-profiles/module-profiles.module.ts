// =============================================================================
// Module Profiles Module
// =============================================================================
// Also includes DecodersController (read-only view of decoders from ModuleProfiles)
// =============================================================================

import { Module } from '@nestjs/common';
import { ModuleProfilesController, DecodersController } from './module-profiles.controller';
import { ModuleProfilesService } from './module-profiles.service';

@Module({
  controllers: [ModuleProfilesController, DecodersController],
  providers: [ModuleProfilesService],
  exports: [ModuleProfilesService],
})
export class ModuleProfilesModule {}

// Export as DeviceProfilesModule for backward compatibility
export { ModuleProfilesModule as DeviceProfilesModule };
