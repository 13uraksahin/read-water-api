// =============================================================================
// Decoders Controller
// =============================================================================

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DecodersService } from './decoders.service';
import type { PaginatedDecoders } from './decoders.service';
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
    @Query('isActive') isActive?: string,
  ): Promise<PaginatedDecoders> {
    return this.decodersService.getDecoders({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      technology,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }
}
