import { Module } from '@nestjs/common';
import { ThreadsAiController } from './threads-ai.controller';
import { ThreadsAiService } from './threads-ai.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ThreadsAiController],
  providers: [ThreadsAiService],
  imports: [PrismaModule ,AuthModule],
})
export class ThreadsAiModule {}