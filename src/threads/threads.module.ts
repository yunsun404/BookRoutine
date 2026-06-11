import { Module } from '@nestjs/common';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({ //Module이라는 데코레이터를 통해서 모듈임을 선언
  // 데코레이터를 통해서 모듈임을 알아채고, 싱글톤 패턴으로 인스턴스 생성함

  controllers: [ThreadsController],
  providers: [ThreadsService],
  imports: [PrismaModule],
})
export class ThreadsModule {}