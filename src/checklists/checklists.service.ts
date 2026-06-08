import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /checklists?date=2025-04-01
  // 캘린더에서 특정 날짜 클릭 시 — 그날 체크리스트 목록 반환
  async findByDate(userId: string, date: string) {
    // ✅ 날짜 문자열을 UTC 기준으로 직접 처리
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    return this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        book: true,
        goal: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  // GET /checklists/upcoming
  // 홈화면 — 오늘/내일/모레 체크리스트 반환
  // 기존 findUpcoming 전체를 아래로 교체
  async findUpcoming(userId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const tasks = await this.prisma.checklist.findMany({
    where: {
      user_id: userId,
      OR: [
        // ✅ 오늘 것은 완료 여부 상관없이 표시
        {
          date: { gte: today, lt: tomorrow },
        },
        // ✅ 내일 이후는 미완료만
        {
          date: { gte: tomorrow },
          check_box: false,
        },
      ],
    },
    include: { book: true },
    orderBy: { date: 'asc' },
  });

  const validTasks = tasks.filter((task) => task.book !== null);

  const bookMap: Record<string,
    {
      book_id: string;
      book_title: string;
      cover_url: string | null;
      tasks: typeof tasks;
    }
  > = {};

  for (const task of validTasks) {
    const bookId = task.book_id!;
    if (!bookMap[bookId]) {
      bookMap[bookId] = {
        book_id: bookId,
        book_title: task.book!.title,
        cover_url: task.book!.cover_url,
        tasks: [],
      };
    }
    if (bookMap[bookId].tasks.length < 3) {
      bookMap[bookId].tasks.push(task);
    }
  }

  return Object.values(bookMap);
}
  // PATCH /checklists/:id/check
  // 체크박스 완료/취소 토글
  async toggleCheck(checklistId: string) {
    const checklist = await this.prisma.checklist.findUnique({
      where: { checklist_id: checklistId },
      include: { book: true },
    });

    if (!checklist) {
      throw new NotFoundException('체크리스트를 찾을 수 없습니다.');
    }

    const nowChecked = !checklist.check_box;

    const updated = await this.prisma.checklist.update({
      where: { checklist_id: checklistId },
      data: {
        check_box: nowChecked,
        checked_at: nowChecked ? new Date() : null,
      },
    });

    // bookshelf 업데이트 (기존 코드 그대로)
    if (checklist.book_id && checklist.daily_pages) {
      const bookshelf = await this.prisma.bookshelf.findFirst({
        where: {
          user_id: checklist.user_id,
          book_id: checklist.book_id,
        },
      });

      if (bookshelf) {
        const totalPages = checklist.book?.total_pages ?? 1;
        const delta = nowChecked
          ? checklist.daily_pages
          : -checklist.daily_pages;
        const newCurrentPage = Math.max(
          0,
          (bookshelf.current_page ?? 0) + delta,
        );
        const newProgress = Math.min(
          100,
          Math.floor((newCurrentPage / totalPages) * 1000) / 10,
        );

        await this.prisma.bookshelf.update({
          where: { bookshelf_id: bookshelf.bookshelf_id },
          data: { current_page: newCurrentPage, progress: newProgress },
        });
      }
    }
  }

  // GET /checklists/monthly?user_id=xxx&year=2026&month=6
  // 한 달치 날짜별 달성 현황 반환
  async findMonthly(userId: string, year: number, month: number) {
    // ✅ UTC 기준으로 월의 첫날/마지막날 설정
    const startDate = new Date(
      `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`,
    );
    const endDate = new Date(
      `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00.000Z`,
    );

    const tasks = await this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        check_box: true,
      },
    });

    const map: Record<string, { total: number; done: number }> = {};

    for (const task of tasks) {
      const key = task.date!.toISOString().split('T')[0];
      if (!map[key]) map[key] = { total: 0, done: 0 };
      map[key].total += 1;
      if (task.check_box) map[key].done += 1;
    }

    return Object.entries(map).map(([date, { total, done }]) => ({
      date,
      total,
      done,
      level: done === 0 ? 0 : done === total ? 2 : 1,
    }));
  }
  // 앱 열 때 호출 — 어제 체크한 항목이 유지됐는지 확인 후 발자국 기록
  async checkYesterdayPaw(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    // 어제 체크리스트 조회
    const yesterdayTasks = await this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        date: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    if (yesterdayTasks.length === 0) return null;

    // 어제 체크리스트가 하나라도 완료됐으면 발자국 기록
    const hasAnyDone = yesterdayTasks.some((t) => t.check_box);
    if (!hasAnyDone) return null;

    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 이미 발자국이 있으면 중복 생성 방지
    const existing = await this.prisma.calendarRecord.findFirst({
      where: {
        user_id: userId,
        date: yesterday,
      },
    });

    if (existing) {
      // 이미 있으면 has_paw만 업데이트
      return this.prisma.calendarRecord.update({
        where: { calendar_id: existing.calendar_id },
        data: { has_paw: true },
      });
    }

    // 없으면 새로 생성
    return this.prisma.calendarRecord.create({
      data: {
        user_id: userId,
        date: yesterday,
        has_paw: true,
      },
    });
  }

  async rolloverMissedTasks(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // ✅ 오늘 이전 미완료만 — 미래 예정된 것 제외
    const missedTasks = await this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        date: { lt: today }, // ✅ 오늘 이전만
        check_box: false,
      },
      include: { goal: true },
    });

    if (missedTasks.length === 0) return null;

    for (const task of missedTasks) {
      if (!task.goal) continue;

      const preferredDays = task.goal.preferred_days as number[];
      const nextDate = this.getNextReadingDay(today, preferredDays);

      // ✅ 같은 goal_id + goal_content가 오늘 이후에 이미 있으면 스킵
      const alreadyScheduled = await this.prisma.checklist.findFirst({
        where: {
          user_id: userId,
          goal_id: task.goal_id,
          goal_content: task.goal_content,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 86400000 * 7), // 오늘부터 7일 이내
          },
          check_box: false,
        },
      });

      if (alreadyScheduled) continue; // 이미 있으면 스킵

      await this.prisma.checklist.create({
        data: {
          user_id: task.user_id,
          book_id: task.book_id,
          goal_id: task.goal_id,
          goal_content: task.goal_content,
          daily_pages: task.daily_pages,
          date: nextDate,
          check_box: false,
        },
      });
    }

    return { rolled: missedTasks.length };
  }
  private getNextReadingDay(from: Date, preferredDays: number[]): Date {
    const next = new Date(from);
    next.setUTCDate(next.getUTCDate() + 1);

    for (let i = 0; i < 7; i++) {
      if (preferredDays.includes(next.getUTCDay())) {
        return next;
      }
      next.setUTCDate(next.getUTCDate() + 1);
    }

    return next;
  }
}
