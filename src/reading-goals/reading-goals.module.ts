import { Module } from '@nestjs/common';
import { ReadingGoalsController } from './reading-goals.controller';
import { ReadingGoalsService } from './reading-goals.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule,AuthModule],
  controllers: [ReadingGoalsController],
  providers: [ReadingGoalsService],
})
export class ReadingGoalsModule {}