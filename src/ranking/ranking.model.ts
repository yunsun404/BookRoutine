import { Module } from '@nestjs/common';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { PrismaModule } from '../prisma/prisma.module'; // 프로젝트의 실제 PrismaModule 경로에 맞게 수정하세요

@Module({
  imports: [PrismaModule],
  controllers: [RankingController],
  providers: [RankingService],
})
export class RankingModule {}