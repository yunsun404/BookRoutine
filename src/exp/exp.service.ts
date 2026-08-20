// exp/exp.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const EXP_REASON = {
  CHECKLIST_COMPLETE: 'CHECKLIST_COMPLETE',
  FOCUS_SESSION: 'FOCUS_SESSION',
  DAILY_QUEST: 'DAILY_QUEST',
  WEEKLY_QUEST: 'WEEKLY_QUEST',
} as const;

@Injectable()
export class ExpService {
  constructor(private prisma: PrismaService) {}

  async addExp(userId: string, amount: number, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.expLog.create({ data: { user_id: userId, amount, reason } });

      const user = await tx.user.update({
        where: { user_id: userId },
        data: { exp: { increment: amount } },
      });

      const newLevel = await this.calculateLevel(tx, user.exp);

      if (newLevel !== user.level) {
        await tx.user.update({ where: { user_id: userId }, data: { level: newLevel } });
      }

      return { exp: user.exp, level: newLevel };
    });
  }

  private async calculateLevel(tx: any, totalExp: number): Promise<number> {
    const thresholds = await tx.levelThreshold.findMany({ orderBy: { level: 'asc' } });
    let level = thresholds[0]?.level ?? 1;
    for (const t of thresholds) {
      if (totalExp >= t.required_exp) level = t.level;
      else break;
    }
    return level;
  }
}