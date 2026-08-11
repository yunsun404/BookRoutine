import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';  //외부 서버(알라딘)와 데이터를 주고받기 위한 통신 도구로, 요청과 응답 처리가 간편하여 사용합니다

@Injectable()
export class ReadingGoalsService {
  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) { }   //readonly 추가




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

  async create(userId: string, body: any) {
    console.log("받아온 body 데이터:", body);

    let bookId = body.book_id ?? null;

    // book_id가 없으면 알라딘 책을 DB에 upsert
    if (!bookId) {
      if (!body.title || !body.total_pages) {
        throw new BadRequestException('book_id 또는 책 정보(title, total_pages)가 필요합니다.');
      }

      const existing = await this.prisma.book.findFirst({
        where: { isbn: body.isbn },
      });

      const upserted = existing ?? await this.prisma.book.create({
        data: {
          title: body.title,
          author: body.author ?? '',
          total_pages: Number(body.total_pages),
          isbn: body.isbn ?? null,
        },
      });

      bookId = upserted.book_id;
    }

    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);

    const book = await this.prisma.book.findUnique({
      where: { book_id: bookId },
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
      throw new BadRequestException('선택한 기간 안에 독서 요일이 없습니다.');
    }

    if (book.total_pages === null) {
      throw new BadRequestException('책의 총 페이지 수가 없습니다.');
    }

    const dailyPages = Math.ceil(book.total_pages / readingDayCount);
    const startPage = body.start_page ?? 1;

    const goal = await this.prisma.readingGoal.create({
      data: {
        user_id: userId,
        book_id: bookId,
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
      where: {
        user_id: userId,
      },
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

  async update(id: string, userId: string, body: any) {
    const goal = await this.findOne(id);
    if (goal.user_id !== userId) {
      throw new NotFoundException('해당 목표를 수정할 권한이 없습니다.');
    }
    const updated = await this.prisma.readingGoal.update({
      where: { goal_id: id },
      data: {
        start_date: body.start_date
          ? new Date(`${body.start_date}T00:00:00.000Z`)
          : undefined,
        end_date: body.end_date
          ? new Date(`${body.end_date}T00:00:00.000Z`)
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
      const { dates } = this.countReadingDays(startDate, endDate, preferredDays);
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
    if (goal.user_id !== userId) {
      throw new NotFoundException('해당 목표를 삭제할 권한이 없습니다.');
    }

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

  async searchBooks(title: string) {   //유사 제목 검색
    return this.prisma.book.findMany({
      where: {
        title: {
          contains: title, // 제목에 포함된 단어 검색
          mode: 'insensitive', // 대소문자 구분 없음
        },
      },
      select: {
        book_id: true,
        title: true,
        author: true,
        total_pages: true, // 총 페이지 정보도 같이 가져옴
      },
    });
  }

  async searchAladinBooks(title: string) {
    const ttbKey = this.configService.get<string>('ALADIN_TTB_KEY');
    const searchUrl = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${ttbKey}&Query=${encodeURIComponent(title)}&QueryType=Title&MaxResults=10&output=js&Version=20131101`;
    const searchRes = await axios.get(searchUrl);
    const items = searchRes.data.item ?? [];

    // isbn13으로 itemPage 추가 조회
    const detailed = await Promise.all(
      items.map(async (item: any) => {
        try {
          const lookupUrl = `http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${ttbKey}&itemIdType=ISBN13&ItemId=${item.isbn13}&output=js&Version=20131101&OptResult=subInfo`;
          const lookupRes = await axios.get(lookupUrl);
          const detail = lookupRes.data.item?.[0];
          return {
            ...item,
            total_pages: detail?.subInfo?.itemPage ?? 0,
          };
        } catch {
          return { ...item, total_pages: 0 };
        }
      }),
    );

    return detailed;
  }


}