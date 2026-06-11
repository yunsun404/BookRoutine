import { Body, Controller, Post, UseGuards, Request, Param, Delete, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../jwtAuth.guard';
import { ReadingRoomService } from './reading-room.service';
import type { CreateRoom } from './reading-room.service';

@Controller('reading-room')
@UseGuards(JwtAuthGuard)
export class ReadingRoomController {
    constructor(private readonly readingRoomService: ReadingRoomService) { }

    @Post('start')
    async createRoom(@Request() req, @Body() createRoom: CreateRoom) {
        const room = await this.readingRoomService.createRoom(req.user.user_id, createRoom);
        const enter = await this.readingRoomService.joinRoom(req.user.user_id, room.room_id);
        // return this.readingRoomService.createRoom(req.user.user_id, createRoom);
        return {
            create: room,
            enter: enter
        };
    }

    @Post(':room_id/join')
    async joinRoom(@Param('room_id') room_id: string, @Request() req) {
        return await this.readingRoomService.joinRoom(req.user.user_id, room_id);
    }

    @Post(':room_id/leave')
    async leaveRoom(@Param('room_id') room_id: string, @Request() req) {
        return await this.readingRoomService.leaveRoom(req.user.user_id, room_id);
    }

    @Delete(':room_id')
    async deleteRoom(@Param('room_id') room_id: string, @Request() req) {
        return await this.readingRoomService.deleteRoom(req.user.user_id, room_id);
    }

    @Get('search')
    async searchRoom(@Query('groupId') group_id: string) {
        return await this.readingRoomService.getRoomByGroup(group_id);
    }

    @Get((':room_id/users'))
    async getUsersInRoom(@Param('room_id') room_id: string) {
        return await this.readingRoomService.getUsersInRoom(room_id);
    }

}
