import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';

@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  // /checklists/upcoming 이 /checklists/:id 보다 위에 있어야 해
  // NestJS는 위에서부터 라우트를 매칭하기 때문에
  // 순서가 바뀌면 'upcoming'을 :id로 인식해버려
  @Get('upcoming')
  findUpcoming(@Query('user_id') userId: string) {
    return this.checklistsService.findUpcoming(userId);
  }
  
  @Get('monthly')
  findMonthly(
    @Query('user_id') userId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.checklistsService.findMonthly(
      userId,
      Number(year),
      Number(month),
    );
  }

  @Get()
  findByDate(@Query('user_id') userId: string, @Query('date') date: string) {
    return this.checklistsService.findByDate(userId, date);
  }

  @Patch(':id/check')
  toggleCheck(@Param('id') id: string) {
    return this.checklistsService.toggleCheck(id);
  }
}
