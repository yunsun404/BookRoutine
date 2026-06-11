import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // image_3bf3b7.png에 있는 jwt-auth.guard 경로 참고

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('age-group')
  async getAgeGroupRanking(@Req() req: any, @Query('date') dateStr?: string) {
    // 프론트에서 날짜를 안 보내주면 현재 시간(서버 기준) 사용
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const userId = req.user.user_id; // JWT 가드에서 파싱된 유저 ID

    return await this.rankingService.getAgeGroupRanking(userId, targetDate);
  }
}