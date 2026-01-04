// =============================================================================
// Modules Module - Communication Modules Management
// =============================================================================

import { Module } from '@nestjs/common';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';

@Module({
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}

// Export as DevicesModule for backward compatibility
export { ModulesModule as DevicesModule };
