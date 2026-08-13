import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 실제 auth 모듈 경로에 맞게 조정
import { QuestService } from './quest.service';

@Controller('quest')
export class QuestController {
    constructor(private readonly questService: QuestService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMyQuests(@Req() req) {
        return this.questService.getMyQuests(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':quest_id/complete')
    async completeQuest(@Req() req, @Param('quest_id') questId: string) {
        const data = await this.questService.completeQuest(req.user.sub, questId);

        return {
            success: true,
            message: '퀘스트를 완료했습니다.',
            data,
        };
    }
}