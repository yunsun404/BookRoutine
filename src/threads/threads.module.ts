import { Module } from '@nestjs/common';
import { ThreadsController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({ 
  // controllers: 웹 요청(URL)을 받아서 처리할 입구(컨트롤러) 등록
  controllers: [ThreadsController],

  // providers: 실무 비즈니스 로직과 DB 처리를 담당할 일꾼(서비스) 등록
  providers: [ThreadsService],

  // imports: 이 모듈 안에서 갖다 써야 하는 다른 모듈들(DB를 위한 Prisma, 로그인을 위한 Auth) 가져오기
  imports: [PrismaModule, AuthModule],
})
export class ThreadsModule {}