import { Module } from '@nestjs/common';
import { ReadingRoomGateway } from './reading-room.gateway';

@Module({
    providers: [ReadingRoomGateway], // 독서방 게이트웨이와 연결
})
export class ReadingRoomModule {}