import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /calendar-records/monthly?year=2026&month=6
  // 한 달치 발자국 데이터 반환
  async findMonthly(userId: string, year: number, month: number) {
    const startDate = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00.000Z`);

    const records = await this.prisma.calendarRecord.findMany({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        has_paw: true,
      },
    });

    return records.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      has_paw: r.has_paw,
    }));
  }
}