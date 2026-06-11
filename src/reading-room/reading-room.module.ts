import { Module } from '@nestjs/common';
import { ReadingRoomController } from './reading-room.controller';
import { ReadingRoomService } from './reading-room.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReadingRoomGateway } from './reading-room.gateway';

@Module({
  controllers: [ReadingRoomController],
  providers: [ReadingRoomService, PrismaService, ReadingRoomGateway],
})
export class ReadingRoomModule { }
