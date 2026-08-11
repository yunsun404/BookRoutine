import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RankResult {
  rank: number;
  username: string;
  nickname: string;
  profile_image: string | null;
  completed_books_count: number;
}

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAgeGroupRanking(userId: string, targetDate: Date) {
    // 1. 요청한 유저의 나이(age) 조회
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: { age: true },
    });

    if (!user || user.age === null) {
      throw new NotFoundException('유저를 찾을 수 없거나 연령 정보가 등록되지 않았습니다.');
    }

    // 2. 연령대 구간 계산 (예: 43세 -> 40대, min: 40, max: 49)
    const ageGroup = Math.floor(user.age / 10) * 10;
    const minAge = ageGroup;
    const maxAge = ageGroup + 9;

    // 3. 해당 월의 시작일과 종료일 계산
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    // 4. 같은 연령대 유저들의 월간 완독 수 기반 랭킹 TOP 20 조회
    // 데이터베이스 컬렉션 매핑 및 대소문자(reading_goals -> reading_goals) 매칭 준수
    const topUsers = await this.prisma.user.findMany({
      where: {
        age: {
          gte: minAge,
          lte: maxAge,
        },
      },
      select: {
        username: true,
        nickname: true,
        profile_image: true,
        _count: {
          select: {
            reading_goals: {
              where: {
                status: 2, // ★ 스키마가 Int? 이므로 완독 완료 상태값 숫자 지정 (예: 2)
                created_at: {
                  gte: startOfMonth,
                  lte: endOfMonth,
                },
              },
            },
          },
        },
      },
      orderBy: {
        reading_goals: {
          _count: 'desc',
        },
      },
      take: 20,
    });

    // 5. 결과 가공 및 순위 매기기
    const ranking: RankResult[] = topUsers.map((u, index) => ({
      rank: index + 1,
      username: u.username,
      nickname: u.nickname,
      profile_image: u.profile_image,
      completed_books_count: u._count.reading_goals,
    }));

    return {
      ageGroup, // 프론트 UI에서 "40대" 타이틀 바인딩용
      ranking,
    };
  }
}