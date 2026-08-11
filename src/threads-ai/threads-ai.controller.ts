import { Body, Controller, Post } from '@nestjs/common';
import { ThreadsAiService } from './threads-ai.service';

@Controller('threads-ai')
export class ThreadsAiController {
  constructor(private readonly threadsAiService: ThreadsAiService) {}

  @Post('summary')
  async summary(@Body() body: { thread_id: string; book_id: string }) {
    // 서비스로 전체 바디를 넘겨줍니다.
    return this.threadsAiService.summary(body);
  }
}