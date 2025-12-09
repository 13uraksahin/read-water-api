// =============================================================================
// Ingestion Controller - High-Performance Reading Intake
// =============================================================================
// CRITICAL: All endpoints return 202 Accepted immediately after queuing
// =============================================================================

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import {
  IngestReadingDto,
  IngestBatchDto,
  LoRaWANUplinkDto,
  SigfoxCallbackDto,
} from './dto/ingestion.dto';
import { Public } from '../../common/decorators';

@Controller('ingest')
export class IngestionController {
  private readonly logger = new Logger(IngestionController.name);

  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * Generic reading ingestion endpoint
   * Accepts any technology's payload
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestReading(@Body() dto: IngestReadingDto) {
    return this.ingestionService.ingestReading(dto);
  }

  /**
   * Batch reading ingestion endpoint
   * For high-volume data uploads
   */
  @Public()
  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  async ingestBatch(@Body() dto: IngestBatchDto) {
    return this.ingestionService.ingestBatch(dto);
  }

  /**
   * LoRaWAN uplink webhook endpoint
   * Compatible with ChirpStack, TTN, and similar
   */
  @Public()
  @Post('lorawan')
  @HttpCode(HttpStatus.ACCEPTED)
  async lorawanUplink(@Body() dto: LoRaWANUplinkDto) {
    this.logger.debug(`LoRaWAN uplink from ${dto.devEUI}`);
    return this.ingestionService.handleLoRaWANUplink(dto);
  }

  /**
   * Sigfox callback webhook endpoint
   */
  @Public()
  @Post('sigfox')
  @HttpCode(HttpStatus.ACCEPTED)
  async sigfoxCallback(@Body() dto: SigfoxCallbackDto) {
    this.logger.debug(`Sigfox callback from ${dto.device}`);
    return this.ingestionService.handleSigfoxCallback(dto);
  }

  /**
   * Health check for ingestion service
   */
  @Public()
  @Post('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return {
      status: 'healthy',
      service: 'ingestion',
      timestamp: new Date().toISOString(),
    };
  }
}

