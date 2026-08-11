import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getStats(
    @Request() req,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('type') type: 'weekly' | 'monthly',
  ) {
    return this.statsService.getUserStats(
      req.user.sub,
      parseInt(year, 10),
      parseInt(month, 10),
      type,
    );
  }
}