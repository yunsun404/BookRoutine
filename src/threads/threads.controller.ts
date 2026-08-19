import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('threads')
@UseGuards(JwtAuthGuard)
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  // 1. 타래 생성 (POST /api/v1/threads)
  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.threadsService.create(req.user.sub, body);
  }

  // 2. 타래 전체 조회 및 도서별 타래 조회 (GET /api/v1/threads 또는 /api/v1/books/{book_id}/threads)
  // * 참고: 도서별 타래 조회는 보통 books 라우터에 두기도 하지만, 필요에 따라 여기서 처리하거나 매칭할 수 있습니다.
  @Get()
  findAll(
    @Req() req: any,
    @Query('book_id') book_id?: string,
  ) {
    return this.threadsService.findAll(req.user.sub, book_id);
  }

  // 3. 내 타래 모아보기 (GET /api/v1/users/me/threads)
  // * 보통 users 컨트롤러에 두거나, threads 컨트롤러에서 관리할 수 있습니다.
  @Get('users/me/threads')
  findMyThreads(@Req() req: any) {
    return this.threadsService.findMyThreads(req.user.sub);
  }

  // 4. 타래 상세 조회 (GET /api/v1/threads/{thread_id})
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.threadsService.findOne(id);
  }

  // 5. 타래 수정 (PATCH /api/v1/threads/{thread_id})
  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.threadsService.update(id, req.user.sub, body);
  }

  // 6. 타래 삭제 (DELETE /api/v1/threads/{thread_id})
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.threadsService.remove(id, req.user.sub);
  }

  // 7. 타래 답글 작성 (POST /api/v1/threads/{thread_id}/replies)
  @Post(':id/replies')
  createReply(@Param('id') threadId: string, @Req() req: any, @Body() body: any) {
    return this.threadsService.createReply(threadId, req.user.sub, body);
  }

  // 8. 그룹 타래 생성 (POST /api/v1/groups/{group_id}/threads)
  // * 만약 경로를 완전히 독립시키고 싶다면 groups.controller.ts로 빼거나 이와 같이 구성할 수 있습니다.
  @Post('groups/:group_id/threads')
  createGroupThread(@Param('group_id') groupId: string, @Req() req: any, @Body() body: any) {
    return this.threadsService.createGroupThread(groupId, req.user.sub, body);
  }
}