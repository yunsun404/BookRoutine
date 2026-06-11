import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReadingGoalsService } from './reading-goals.service';

@Controller('reading-goals')
export class ReadingGoalsController {
  constructor(private readonly readingGoalsService: ReadingGoalsService) { }

  // 1. [검색] 무조건 위로 올려야 합니다! 
  // 그래야 'search'라는 글자를 id로 착각하지 않습니다.
  @Get('search')
  async searchBooks(@Query('title') title: string) {
    return this.readingGoalsService.searchAladinBooks(title);
  }

  // 2. [조회] 검색이 아닌 경우(일반 id 조회 등)는 그 아래로 배치
  @Get()
  findAll() {
    return this.readingGoalsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readingGoalsService.findOne(id);
  }

  // 3. [기타 동작]
  @Post()
  create(@Body() body: any) {
    return this.readingGoalsService.create(body);
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