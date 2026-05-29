import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 방 만들기
export interface CreateRoom {
    room_id: string;
    group_id: string;
    book_id: string;
    started_by: string;
    is_active: boolean;
    started_at: Date | null;
    ended_at: Date | null;
}

@Injectable()
export class ReadingRoomService {
    constructor(private prisma: PrismaService) { }

    createRoom(user_id: string, createRoom: CreateRoom) {
        return this.prisma.readingRoom.create({
            data: {
                group_id: createRoom.group_id,
                book_id: createRoom.book_id,
                started_by: user_id,
                is_active: true,
                started_at: new Date(),
            },
        });
    }

    async joinRoom(user_id: string, room_id: string) {
        const room = await this.prisma.readingRoom.findUnique({
            where: { room_id },
        });
        const already = await this.prisma.readingRoomUser.findFirst({
            where: { user_id: user_id, room_id: room_id }
        });
        if (!room) throw new NotFoundException('Room not found');
        if (already) throw new NotFoundException('Already Joined');
        return this.prisma.readingRoomUser.create({
            data: {
                user_id,
                room_id,
                entered_at: new Date(),
            }
        });
    }

    async leaveRoom(user_id: string, room_id: string) {
        const roomUser = await this.prisma.readingRoomUser.findFirst({
            where: {
                user_id: user_id,
                room_id: room_id,
                exited_at: null
            },
        });
        if (!roomUser) throw new NotFoundException('Did Not Entered');
        return this.prisma.readingRoomUser.update({
            where: { room_user_id: roomUser.room_user_id },
            data: { exited_at: new Date() }
        })
    }

    async deleteRoom(user_id: string, room_id: string) {
        try {
            const room = await this.prisma.readingRoom.findFirst({
                where: { started_by: user_id, room_id: room_id }
            });
            if (!room) throw new NotFoundException('Room Not Found');
            if (room.ended_at) throw new BadRequestException('Already Ended')
            return this.prisma.readingRoom.update({
                where: {
                    room_id,
                    started_by: user_id
                },
                data: {
                    is_active: false,
                    ended_at: new Date()
                }
            });
        } catch (error: any) {
            throw new NotFoundException('Failed to delete reading-room: ' + error.message);
        }
    }

    async getRoomByGroup(group_id: string) {
        const room = await this.prisma.readingRoom.findMany({
            where: {
                group_id: group_id,
                is_active: true
            }
        });
        if (!room) throw new NotFoundException('Room Not Found');
        return room;
    }

    async getUsersInRoom(room_id: string) {
        const users = await this.prisma.readingRoomUser.findMany({
            where: {
                room_id: room_id,
                exited_at: null
            }
        });
        return users;
    }
}
