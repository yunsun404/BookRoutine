import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReadingGoalsService } from './reading-goals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('reading-goals')
@UseGuards(JwtAuthGuard)
export class ReadingGoalsController {
  constructor(private readonly readingGoalsService: ReadingGoalsService) {}

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.readingGoalsService.create(req.user.sub, body);
  }

  @Get()
  findAll(@Req() req) {
    return this.readingGoalsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readingGoalsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.readingGoalsService.update(id, req.user.sub, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.readingGoalsService.remove(id, req.user.sub);
  }
}
