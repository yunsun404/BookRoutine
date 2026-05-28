import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ThreadsService } from './threads.service';


// 모듈에서 사용할 컨트롤러를 포함하여 사용
//컨트롤러는 여느 웹 프레임워크와 마찬가지로 
// HTTP 요청 라우터의 엔드포인트로 등록


@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  create(@Body() body: any) {
    return this.threadsService.create(body);
  }

 @Get()
  findAll(
  @Query('user_id') user_id?: string,
  @Query('book_id') book_id?: string,
) {
  return this.threadsService.findAll(user_id, book_id);
}
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.threadsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.threadsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.threadsService.remove(id);
  }
}