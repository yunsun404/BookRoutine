import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadingGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private countReadingDays(
    startDate: Date,
    endDate: Date,
    preferredDays: number[],
  ) {
    let count = 0;
    const dates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getUTCDay(); // ✅ UTC 기준 요일
      if (preferredDays.includes(day)) {
        count++;
        dates.push(new Date(current));
      }
      current.setUTCDate(current.getUTCDate() + 1); // ✅ UTC 기준 날짜 증가
    }

    return { count, dates };
  }

  async create(userId: string, body: any) {
    // ✅ UTC 기준으로 파싱 — 한국 timezone에서 하루 밀리는 문제 방지
    const startDate = new Date(`${body.start_date}T00:00:00.000Z`);
    const endDate = new Date(`${body.end_date}T00:00:00.000Z`);

    const book = await this.prisma.book.findUnique({
      where: { book_id: body.book_id },
    });

    if (!book) {
      throw new NotFoundException('책을 찾을 수 없습니다.');
    }

    const preferredDays: number[] = body.preferred_days;
    const { count: readingDayCount, dates } = this.countReadingDays(
      startDate,
      endDate,
      preferredDays,
    );

    if (readingDayCount === 0) {
      throw new Error('선택한 기간 안에 독서 요일이 없습니다.');
    }

    if (book.total_pages === null) {
      throw new Error('책의 총 페이지 수가 없습니다.');
    }

    const dailyPages = Math.ceil(book.total_pages / readingDayCount);
    const startPage = body.start_page ?? 1;

    const goal = await this.prisma.readingGoal.create({
      data: {
        user_id: userId,
        book_id: body.book_id,
        start_date: startDate,
        end_date: endDate,
        period: readingDayCount,
        daily_pages: dailyPages,
        preferred_days: preferredDays,
        status: 0,
      },
    });

    await this.prisma.checklist.createMany({
      data: dates.map((date, index) => {
        const fromPage = startPage + index * dailyPages;
        const toPage = Math.min(fromPage + dailyPages - 1, book.total_pages!);
        return {
          user_id: userId,
          book_id: body.book_id,
          goal_id: goal.goal_id,
          goal_content: `${book.title} ${fromPage} ~ ${toPage}쪽 읽기`,
          daily_pages: dailyPages,
          date,
          check_box: false,
        };
      }),
    });

    return {
      goal,
      book,
      reading_day_count: readingDayCount,
      daily_pages: dailyPages,
      checklist_dates: dates,
    };
  }

  findAll(userId: string) {
    return this.prisma.readingGoal.findMany({
      where: { user_id: userId },
      include: { book: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const goal = await this.prisma.readingGoal.findUnique({
      where: { goal_id: id },
      include: { book: true, checklists: true },
    });

    if (!goal) {
      throw new NotFoundException('목표를 찾을 수 없습니다.');
    }

    return goal;
  }

  async update(id: string, userId: string, body: any) {
    const goal = await this.findOne(id);
    if (String(goal.user_id) !== userId) throw new ForbiddenException();

    const updated = await this.prisma.readingGoal.update({
      where: { goal_id: id },
      data: {
        start_date: body.start_date
          ? new Date(`${body.start_date}T00:00:00.000Z`) // ✅ UTC 기준
          : undefined,
        end_date: body.end_date
          ? new Date(`${body.end_date}T00:00:00.000Z`) // ✅ UTC 기준
          : undefined,
        preferred_days: body.preferred_days,
        status: body.status,
      },
      include: { book: true },
    });

    const scheduleChanged =
      body.start_date || body.end_date || body.preferred_days;

    if (scheduleChanged) {
      await this.prisma.checklist.deleteMany({ where: { goal_id: id } });

      const startDate = new Date(updated.start_date!);
      const endDate = new Date(updated.end_date!);
      const preferredDays = updated.preferred_days as number[];
      const { dates } = this.countReadingDays(
        startDate,
        endDate,
        preferredDays,
      );
      const dailyPages = updated.daily_pages ?? 0;
      const startPage = body.start_page ?? 1;

      await this.prisma.checklist.createMany({
        data: dates.map((date, index) => {
          const fromPage = startPage + index * dailyPages;
          const toPage = Math.min(
            fromPage + dailyPages - 1,
            updated.book.total_pages ?? 9999,
          );
          return {
            user_id: updated.user_id,
            book_id: updated.book_id,
            goal_id: id,
            goal_content: `${updated.book.title} ${fromPage} ~ ${toPage}쪽 읽기`,
            daily_pages: dailyPages,
            date,
            check_box: false,
          };
        }),
      });
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    const goal = await this.findOne(id);
    if (String(goal.user_id) !== userId) throw new ForbiddenException(); // ✅ 추가
    await this.prisma.checklist.deleteMany({ where: { goal_id: id } });
    return this.prisma.readingGoal.delete({ where: { goal_id: id } });
  }
}
