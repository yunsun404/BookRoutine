import { Module } from '@nestjs/common';
import { ReadingRoomController } from './reading-room.controller';
import { ReadingRoomService } from './reading-room.service';
import { ReadingRoomGateway } from './reading-room.gateway';
import { PrismaService } from '../prisma/prisma.service'; 


@Module({
  // 1. HTTP 요청(POST/GET)을 받아줄 컨트롤러 등록
  controllers: [ReadingRoomController], 
  
  // 2. 실시간 통신(Gateway), 핵심 로직(Service), 데이터베이스(Prisma) 등록
  providers: [
    ReadingRoomGateway, 
    ReadingRoomService, 
    PrismaService
  ],
})
export class ReadingRoomModule {}