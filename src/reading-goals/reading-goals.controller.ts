import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ReadingGoalsService } from './reading-goals.service';

@Controller('reading-goals')
export class ReadingGoalsController {
  constructor(private readonly readingGoalsService: ReadingGoalsService) {}

  @Post()
  create(@Body() body: any) {
    return this.readingGoalsService.create(body);
  }

  @Get()
  findAll() {
    return this.readingGoalsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readingGoalsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.readingGoalsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.readingGoalsService.remove(id);
  }
}