import { Module } from '@nestjs/common';
import { ThreadsAiController } from './threads-ai.controller';
import { ThreadsAiService } from './threads-ai.service';

@Module({
  controllers: [ThreadsAiController],
  providers: [ThreadsAiService],
})
export class ThreadsAiModule {}