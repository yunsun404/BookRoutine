import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


// 모듈에서 사용할 컨트롤러를 포함하여 사용
//컨트롤러는 여느 웹 프레임워크와 마찬가지로 
// HTTP 요청 라우터의 엔드포인트로 등록


@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  create(@Req() req: any,@Body() body: any) {
    return this.threadsService.create(req.user.sub,body);
  }

 @Get()
  findAll(
  @Req() req,
  @Query('book_id') book_id?: string,
) {
  return this.threadsService.findAll(req.user.sub, book_id);
}
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.threadsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any,@Body() body: any) {
    return this.threadsService.update(id,req.user.sub, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string,@Req() req: any) {
    return this.threadsService.remove(id,req.user.sub);
  }
}