import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChecklistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByDate(userId: string, date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    return this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        date: { gte: start, lte: end },
      },
      include: { book: true, goal: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async findUpcoming(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);

    const tasks = await this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        OR: [
          { date: { gte: today, lt: tomorrow } },
          { date: { gte: tomorrow }, check_box: false },
        ],
      },
      include: { book: true },
      orderBy: { date: 'asc' },
    });

    const validTasks = tasks.filter((task) => task.book !== null);

    type TaskItem = (typeof tasks)[number];
    const bookMap: Record<string, {
      book_id: string;
      book_title: string;
      cover_url: string | null;
      tasks: TaskItem[];
    }> = {};

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

    return updated; // ✅ 추가
  }

  async findMonthly(userId: string, year: number, month: number) {
    const startDate = new Date(
      `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`,
    );
    const endDate = new Date(
      `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00.000Z`,
    );

    const tasks = await this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        date: { gte: startDate, lt: endDate },
      },
      select: { date: true, check_box: true },
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

  async checkYesterdayPaw(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    const yesterdayTasks = await this.prisma.checklist.findMany({
      where: {
        user_id: userId,
        date: { gte: yesterday, lt: today },
      },
    });

    if (yesterdayTasks.length === 0) return null;

    const hasAnyDone = yesterdayTasks.some((t) => t.check_box);
    if (!hasAnyDone) return null;

    const existing = await this.prisma.calendarRecord.findFirst({
      where: { user_id: userId, date: yesterday },
    });

    if (existing) {
      return this.prisma.calendarRecord.update({
        where: { calendar_id: existing.calendar_id },
        data: { has_paw: true },
      });
    }

    return this.prisma.calendarRecord.create({
      data: {
        user_id: userId,
        date: yesterday,
        has_paw: true,
      },
    });
  }
}