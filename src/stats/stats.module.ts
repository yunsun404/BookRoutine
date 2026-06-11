import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service'; // 프로젝트 경로에 맞춰 확인

@Module({
  controllers: [StatsController],
  providers: [StatsService, PrismaService],
})
export class StatsModule {}