import { Body, Controller, Post } from '@nestjs/common';
import { ThreadsAiService } from './threads-ai.service';

@Controller('threads-ai')
export class ThreadsAiController {
  constructor(private readonly threadsAiService: ThreadsAiService) {}

  @Post('summary')
  summary(@Body() body: { thread_id: string; text: string }) {
    return this.threadsAiService.summary(body);
  }
}