// =============================================================================
// Ingestion Module
// =============================================================================

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { QUEUES } from '../../common/constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.READINGS,
    }),
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}

