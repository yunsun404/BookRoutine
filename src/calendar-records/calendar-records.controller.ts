import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { CalendarRecordsService } from './calendar-records.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('calendar-records')
export class CalendarRecordsController {
  constructor(private readonly calendarRecordsService: CalendarRecordsService) {}

  @Get('monthly')
  findMonthly(
    @Req() req,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.calendarRecordsService.findMonthly(
      req.user.sub,
      Number(year),
      Number(month),
    );
  }
}