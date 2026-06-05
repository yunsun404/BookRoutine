import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThreadsAiService } from './threads-ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('threads-ai')
@UseGuards(JwtAuthGuard)
export class ThreadsAiController {
  constructor(private readonly threadsAiService: ThreadsAiService) {}

  @Post('summary')
  summary(@Body() body: { thread_id: string; text: string }) {
    return this.threadsAiService.summary(body);
  }
}