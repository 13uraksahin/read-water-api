// =============================================================================
// Decoders Controller - Refactored for Asset/Device Split
// =============================================================================
// Decoders are now stored in DeviceProfile, not separate model
// =============================================================================

import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { DecodersService } from './decoders.service';
import type { PaginatedDecoders, DecoderData } from './decoders.service';
import { JwtAuthGuard } from '../iam/auth/guards/jwt-auth.guard';

@Controller('decoders')
@UseGuards(JwtAuthGuard)
export class DecodersController {
  constructor(private readonly decodersService: DecodersService) {}

  @Get()
  async getDecoders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('technology') technology?: string,
    @Query('brand') brand?: string,
  ): Promise<PaginatedDecoders> {
    return this.decodersService.getDecoders({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      technology,
      brand,
    });
  }

  @Get(':id')
  async getDecoder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DecoderData | null> {
    return this.decodersService.getDecoder(id);
  }
}
