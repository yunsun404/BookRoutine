import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getUserStats(userId: string, year: number, month: number, type: 'weekly' | 'monthly') {
    // 1. 선택한 년/월의 시작일과 종료일 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 2. 해당 월에 완료(체크)된 체크리스트 가져오기 (그래프 및 독서시간 계산용)
    const checkedItems = await this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        check_box: true,
        updated_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        updated_at: true,
      },
    });

    // 3. 그래프 데이터 가공 (주간: 일~토 요일별 / 월간: 1~5주차별 완료된 목표 수)
    const graphData = this.calculateGraphData(checkedItems, type);

    // 4. 주 독서 시간 평균 계산 (체크된 시간 평균 - 1시간)
    let averageReadingTime = '데이터 없음';
    if (checkedItems.length > 0) {
      let totalMinutes = 0;
      checkedItems.forEach((item) => {
        const date = new Date(item.updated_at);
        totalMinutes += date.getHours() * 60 + date.getMinutes();
      });

      // 평균 분 구한 뒤 1시간(60분) 빼기
      const avgMinutes = Math.floor(totalMinutes / checkedItems.length) - 60;
      // 음수 방지 예외처리
      const finalMinutes = avgMinutes < 0 ? 0 : avgMinutes;
      
      const hours = Math.floor(finalMinutes / 60).toString().padStart(2, '0');
      const mins = (finalMinutes % 60).toString().padStart(2, '0');
      averageReadingTime = `${hours}:${mins}`;
    }

    // 5. 진행 중인 모든 목표(ReadingGoal)와 각 목표에 대한 체크리스트 가져오기
    // 💡 Prisma 스키마 기준: status는 Int? 이므로 진행 중 상태 코드를 정수(예: 0 또는 1)로 매칭해야 합니다. 
    // 여기서는 활성화된 상태를 임의로 1 혹은 전체로 조회하도록 하거나, status 필터 조건을 뺴고 book 정보를 조인합니다.
    const ongoingGoals = await this.prisma.readingGoal.findMany({
      where: {
        user_id: userId,
        // status: 1 // 필요하다면 프로젝트에서 정한 '진행중'을 뜻하는 숫자를 넣어주세요!
      },
      include: {
        checklists: true,
        book: true, // book 정보를 함께 가져와 제목과 커버 이미지를 참조합니다.
      },
    });

    let totalChecklists = 0;
    let totalChecked = 0;

    ongoingGoals.forEach((goal) => {
      totalChecklists += goal.checklists.length;
      totalChecked += goal.checklists.filter((c) => c.check_box === true).length;
    });

    const overallProgress = totalChecklists > 0 
      ? Math.round((totalChecked / totalChecklists) * 100) 
      : 0;

    // 6. 각 책별 진행도 리스트 매핑 (Prisma 스키마의 실제 필드명 반영)
    const booksProgress = ongoingGoals.map((goal) => {
      const goalChecklists = goal.checklists.length;
      const goalChecked = goal.checklists.filter((c) => c.check_box === true).length;
      
      return {
        id: goal.book_id,
        title: goal.book?.title || '제목 없음', // 관계형 book 객체에서 title 참조
        coverUrl: goal.book?.cover_url || null, // 관계형 book 객체에서 cover_url 참조
        progress: goalChecklists > 0 ? Math.round((goalChecked / goalChecklists) * 100) : 0,
      };
    });

    return {
      graphData,
      averageReadingTime,
      overallProgress,
      booksProgress,
    };
  }

  // 막대그래프 배열 생성 헬퍼 함수
  private calculateGraphData(items: { updated_at: Date }[], type: 'weekly' | 'monthly') {
    if (type === 'weekly') {
      // 일(0) ~ 토(6) 요일별 카운트
      const counts = [0, 0, 0, 0, 0, 0, 0];
      items.forEach((item) => {
        const day = new Date(item.updated_at).getDay();
        counts[day]++;
      });
      return counts;
    } else {
      // 월간 주차별 카운트 (1주차 ~ 5주차)
      const counts = [0, 0, 0, 0, 0];
      items.forEach((item) => {
        const date = new Date(item.updated_at).getDate();
        const weekIndex = Math.floor((date - 1) / 7);
        if (weekIndex < 5) counts[weekIndex]++;
      });
      return counts;
    }
  }
}