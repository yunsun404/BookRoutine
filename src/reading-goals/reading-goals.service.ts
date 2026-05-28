import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReadingGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private countReadingDays(startDate: Date, endDate: Date, preferredDays: number[]) {
    let count = 0;
    const dates: Date[] = [];

    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();

      if (preferredDays.includes(day)) {
        count++;
        dates.push(new Date(current));
      }

      current.setDate(current.getDate() + 1);
    }

    return { count, dates };
  }

  async create(body: any) {
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    const book = await this.prisma.book.findUnique({
      where: {
        book_id: body.book_id,
      },
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

    const goal = await this.prisma.readingGoal.create({
      data: {
        user_id: body.user_id,
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
      data: dates.map((date) => ({
        user_id: body.user_id,
        book_id: body.book_id,
        goal_id: goal.goal_id,
        goal_content: `${book.title} ${dailyPages}쪽 읽기`,
        daily_pages: dailyPages,
        date,
        check_box: false,
      })),
    });

    return {
      goal,
      book,
      reading_day_count: readingDayCount,
      daily_pages: dailyPages,
      checklist_dates: dates,
    };
  }

  findAll() {
    return this.prisma.readingGoal.findMany({
      include: {
        book: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const goal = await this.prisma.readingGoal.findUnique({
      where: {
        goal_id: id,
      },
      include: {
        book: true,
        checklists: true,
      },
    });

    if (!goal) {
      throw new NotFoundException('목표를 찾을 수 없습니다.');
    }

    return goal;
  }

  async update(id: string, body: any) {
    await this.findOne(id);

    return this.prisma.readingGoal.update({
      where: {
        goal_id: id,
      },
      data: {
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : undefined,
        preferred_days: body.preferred_days,
        status: body.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.checklist.deleteMany({
      where: {
        goal_id: id,
      },
    });

    return this.prisma.readingGoal.delete({
      where: {
        goal_id: id,
      },
    });
  }
}