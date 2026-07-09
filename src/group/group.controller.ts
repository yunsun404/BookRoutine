import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateGroupBookDto, CreateGroupDto, GroupService, UpdateGroupDto } from './group.service';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupController {
    constructor(
        private groupService: GroupService,
    ) { }

    @Post()
    async createGroup(@Request() req, @Body() body: CreateGroupDto) {
        return this.groupService.createGroup(req.user.sub, body);
    }

    @Get()
    async getGroupList(@Request() req) {
        return this.groupService.getGroupList(req.user.sub);
    }

    @Get(':group_id')
    async getGroup(@Param('group_id') group_id: string) {
        return this.groupService.getGroup(group_id);
    }

    @Post('/join')
    async joinGroup(@Request() req, @Body() body: { invite_code: string }) {
        return await this.groupService.joinGroup(req.user.sub, body.invite_code);
    }
    @Post(':group_id/leave')
    async leaveGroup(@Request() req, @Param('group_id') group_id: string) {
        return await this.groupService.leaveGroup(req.user.sub, group_id);
    }

    @Post(':group_id/book')
    async setGroupBook(@Request() req, @Param('group_id') group_id: string, @Body() body: CreateGroupBookDto) {
        return await this.groupService.setGroupBook(req.user.sub, group_id, body);
    }

    @Get(':group_id/threads')
    async getGroupThread(@Param('group_id') group_id: string) {
        return await this.groupService.getGroupThread(group_id);
    }

    @Get(':group_id/realtime-status')
    async getReadingRoomStatus(@Param('group_id') group_id: string) {
        return await this.groupService.getReadingRoomStatus(group_id);
    }

    @Patch(':group_id/update')
    async updateGroup(@Request() req, @Param('group_id') group_id: string, @Body() body: UpdateGroupDto) {
        return await this.groupService.updateGroup(req.user.user_id, group_id, body);
    }

    @Delete(':group_id')
    async deleteGroup(@Request() req, @Param('group_id') group_id: string) {
        return await this.groupService.deleteGroup(req.user.sub, group_id);
    }
}
