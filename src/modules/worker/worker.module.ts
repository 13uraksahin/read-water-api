// =============================================================================
// Worker Module - BullMQ Job Processors
// =============================================================================

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReadingsProcessor } from './readings.processor';
import { DecoderService } from './decoder.service';
import { QUEUES } from '../../common/constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.READINGS,
    }),
  ],
  providers: [ReadingsProcessor, DecoderService],
  exports: [DecoderService],
})
export class WorkerModule {}

