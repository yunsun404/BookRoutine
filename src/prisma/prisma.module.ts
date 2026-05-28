import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 전역으로 사용 가능하게
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
