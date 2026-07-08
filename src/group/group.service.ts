import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGroupDto {
    @IsString()
    group_name!: string;
    @IsNumber()
    @IsOptional()
    people_count?: number;
    @IsString()
    @IsOptional()
    book_id?: string;
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    target_date?: Date;
}
export class CreateGroupBookDto {
    @IsString()
    book_id!: string;
    @Type(() => Date)
    @IsDate()
    @IsOptional()
    target_date?: Date;
}
export class UpdateGroupDto {
    @IsString()
    @IsOptional()
    group_name?: string;
    @IsNumber()
    @IsOptional()
    people_count?: number;
    @IsString()
    @IsOptional()
    book_id?: string;
}

@Injectable()
export class GroupService {
    constructor(
        private prisma: PrismaService,
    ) { }

    // 초대코드 만드는 함수
    generateInviteCode(length: number, type: 'numeric' | 'alphanumeric' = 'numeric'): string {
        if (length <= 0) throw new Error('Length must be greater than 0');

        const chars = type === 'numeric' ? '0123456789' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const bytes = randomBytes(length);
        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars[bytes[i] % chars.length];
        }

        return result;
    }

    async createGroup(user_id: string, dto: CreateGroupDto) {
        const new_group = await this.prisma.group.create({
            data: {
                group_name: dto.group_name,
                people_count: dto.people_count,
                invite_code: this.generateInviteCode(8, 'alphanumeric'),
                created_by: user_id,
                created_at: new Date()
            }
        });

        const new_group_member = await this.prisma.groupMember.create({
            data: {
                group_id: new_group.group_id,
                user_id: user_id,
                role: 1, // 방장을 1, 일반 멤버를 0으로 함
                joined_at: new Date()
            }
        });

        if (dto.book_id) {
            await this.prisma.groupBook.create({
                data: {
                    group_id: new_group.group_id,
                    book_id: dto.book_id,
                    target_date: dto.target_date,
                    created_at: new Date()
                }
            });
        };
        const new_group_book = await this.prisma.groupBook.findFirst({
            where: {
                group_id: new_group.group_id,
                book_id: dto.book_id
            }
        });

        return { new_group, new_group_member, new_group_book };
    }

    async getGroupList(user_id: string) {
        return await this.prisma.group.findMany({
            where: {
                group_members: {
                    some: { user_id: user_id }
                }
            }, include: { group_books: true }
        });
    }

    async getGroup(group_id: string) {
        return await this.prisma.group.findUnique({
            where: {
                group_id: group_id
            }, include: { group_books: true }
        });
    }

    async joinGroup(user_id: string, invite_code: string) {
        const group = await this.prisma.group.findFirst({
            where: {
                invite_code: invite_code,
                
            }
        });
        const member_count = await this.prisma.groupMember.count({
            where: { group_id: group?.group_id }
        });

        if (!group) throw new NotFoundException('없는 그룹에 가입할 수 없음');
        if (group.people_count != null && member_count >= group.people_count) throw new ForbiddenException('인원이 가득 차서 가입할 수 없음');

        return await this.prisma.groupMember.create({
            data: {
                group_id: group.group_id,
                user_id: user_id,
                role: 0,
                joined_at: new Date()
            }
        });
    }

    leaveGroup(user_id: string, group_id: string) {
        // return this.prisma.groupMember.updateMany({
        //     where: {
        //         group_id: group_id,
        //         user_id: user_id
        //     },
        //     data: {
        //         // left_at:new Date()
        //     }
        // });
        return this.prisma.groupMember.deleteMany({
            where: {
                group_id: group_id,
                user_id: user_id
            }
        })
    }

    async setGroupBook(user_id: string, group_id: string, dto: CreateGroupBookDto) {
        const group = await this.prisma.group.findUnique({
            where: {
                group_id: group_id,
                created_by: user_id
            }
        });
        if (user_id !== group?.created_by) throw new ForbiddenException('방장이 목표 도서를 설정할 수 있음');
        return await this.prisma.groupBook.create({
            data: {
                group_id: group_id,
                book_id: dto.book_id,
                target_date: dto.target_date,
                created_at: new Date()
            }
        });
    }

    async getGroupThread(group_id: string) {
        return await this.prisma.thread.findMany({
            where: {
                group_id: group_id
            },include:{
                user:{select:{nickname:true}},
                book:{select:{title:true}}
            }
        })
    }

    async getReadingRoomStatus(group_id: string) {
        const reading_room = await this.prisma.readingRoom.findFirst({
            where: { group_id: group_id }
        });
        if (reading_room?.is_active)
            return { is_active: true }
        else
            return { is_active: false }
    }

    async updateGroup(group_id: string, body: UpdateGroupDto) {
        const update_group = await this.prisma.group.update({
            where: { group_id: group_id },
            data: {
                group_name: body.group_name,
                people_count: body.people_count
            }
        });
        const update_groupbook = await this.prisma.groupBook.updateMany({
            where: { group_id: group_id },
            data: { book_id: body.book_id }
        });
        return { update_group, update_groupbook }
    }

    async deleteGroup(user_id: string, group_id: string) {
        const group = await this.prisma.group.findFirst({
            where: {
                group_id: group_id,
                created_by: user_id
            }
        });
        if (user_id !== group?.created_by) {
            throw new ForbiddenException('방장이 아니므로 방을 삭제할 수 없음');
        }
        await this.prisma.groupMember.deleteMany({
            where: {
                group_id: group_id,
            }
        });
        await this.prisma.groupBook.deleteMany({
            where: {
                group_id: group_id,
            }
        });
        // readingroomUser도 지우고 readingroom도 지워야 함
        // thread도 지우고 하여간 엮인거 다 지워야 함 group_id는 분명 유니크니까 그걸로 찾아도 될거임
        await this.prisma.group.delete({
            where: {
                group_id: group_id
            }
        });
        return { message: "deleted group successfully: ", group }
    }
}
