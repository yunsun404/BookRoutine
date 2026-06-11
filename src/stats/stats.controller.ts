import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getStats(
    @Query('user_id') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('type') type: 'weekly' | 'monthly',
  ) {
    return this.statsService.getUserStats(
      userId,
      parseInt(year, 10),
      parseInt(month, 10),
      type,
    );
  }
}