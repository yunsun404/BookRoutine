import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module'; // 경로는 실제 프로젝트에 맞게 수정
import { EbooksController } from './ebooks.controller';
import { EbooksService } from './ebooks.service';

@Module({
  imports: [PrismaModule],
  controllers: [EbooksController],
  providers: [EbooksService],
})
export class EbooksModule {}