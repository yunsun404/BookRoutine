// points/points.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const POINT_REASON = {
  CHECKLIST_COMPLETE: 'CHECKLIST_COMPLETE',
  CHECKLIST_CANCEL: 'CHECKLIST_CANCEL',
  CHARACTER_PURCHASE: 'CHARACTER_PURCHASE',
} as const;

@Injectable()
export class PointsService {
  constructor(private prisma: PrismaService) {}

  async addPoint(userId: string, amount: number, reason: string) {
    const [, user] = await this.prisma.$transaction([
      this.prisma.pointLog.create({ data: { user_id: userId, amount, reason } }),
      this.prisma.user.update({
        where: { user_id: userId },
        data: { points: { increment: amount } },
      }),
    ]);
    return { points: user.points };
  }

  async getMyTotalPoint(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { user_id: userId },
      select: { points: true },
    });
    return { total_point: user.points };
  }

  async getMyLogs(userId: string) {
    return this.prisma.pointLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }
}