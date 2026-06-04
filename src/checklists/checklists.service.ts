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
    today.setHours(0, 0, 0, 0);

    const tasks = await this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        date: { gte: today },
        check_box: false,
      },
      include: { book: true },
      orderBy: { date: 'asc' },
    });

    // 책별로 그루핑 — 각 책의 앞으로 할 것 3개씩
    const bookMap: Record<
      string,
      {
        book_id: string;
        book_title: string;
        cover_url: string | null;
        tasks: typeof tasks;
      }
    > = {};

    // 책별로 그루핑 전에 book 없는 항목 제거
    const validTasks = tasks.filter((task) => task.book !== null);

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
      include: { book: true }, // ✅ 추가: total_pages 필요
    });

    if (!checklist) {
      throw new NotFoundException('체크리스트를 찾을 수 없습니다.');
    }

    const nowChecked = !checklist.check_box;

    // 체크리스트 업데이트
    const updated = await this.prisma.checklist.update({
      where: { checklist_id: checklistId },
      data: {
        check_box: nowChecked,
        checked_at: nowChecked ? new Date() : null,
      },
    });

    // ✅ 추가: bookshelf current_page, progress 업데이트
    if (checklist.book_id && checklist.daily_pages) {
      const bookshelf = await this.prisma.bookshelf.findFirst({
        where: {
          user_id: checklist.user_id,
          book_id: checklist.book_id,
        },
      });

      if (bookshelf) {
        const totalPages = checklist.book?.total_pages ?? 1;
        // 체크 시 +, 취소 시 - (토글이니까)
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
          data: {
            current_page: newCurrentPage,
            progress: newProgress,
          },
        });
      }
    }

    return updated;
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
}
