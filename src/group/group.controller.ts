import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../jwtAuth.guard';
import { CreateGroupBookDto, CreateGroupDto, GroupService, UpdateGroupDto } from './group.service';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupController {
    constructor(
        private groupService: GroupService,
    ) { }

    @Post()
    async createGroup(@Request() req, @Body() body: CreateGroupDto) {
        return this.groupService.createGroup(req.user.user_id, body);
    }

    @Get()
    async getGroupList(@Request() req) {
        return this.groupService.getGroupList(req.user.user_id);
    }

    @Get(':group_id')
    async getGroup(@Param('group_id') group_id: string) {
        return this.groupService.getGroup(group_id);
    }

    @Post('/join')
    async joinGroup(@Request() req, @Body() body: { group_id: string, invite_code: string }) {
        return await this.groupService.joinGroup(req.user.user_id, body.group_id, body.invite_code);
    }

    @Post(':group_id/leave')
    async leaveGroup(@Request() req, @Param('group_id') group_id: string) {
        return await this.groupService.leaveGroup(req.user.user_id, group_id);
    }

    @Post(':group_id/book')
    async setGroupBook(@Request() req, @Param('group_id') group_id: string, @Body() body: CreateGroupBookDto) {
        return await this.groupService.setGroupBook(req.user.user_id, group_id, body);
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
    async updateGroup(@Param('group_id') group_id: string, @Body() body: UpdateGroupDto) {
        return await this.groupService.updateGroup(group_id, body);
    }

    @Delete(':group_id')
    async deleteGroup(@Request() req, @Param('group_id') group_id: string) {
        return await this.groupService.deleteGroup(req.user.user_id, group_id);
    }
}
