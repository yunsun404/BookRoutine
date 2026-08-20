// level/level.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LevelService {
  constructor(private prisma: PrismaService) {}
  
  async getMyLevel(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { user_id: userId },
      select: { level: true, exp: true },
    });

    const thresholds = await this.prisma.levelThreshold.findMany({
      orderBy: { level: 'asc' },
    });
    const currentThreshold = thresholds.find((t) => t.level === user.level);
    const nextThreshold = thresholds.find((t) => t.level === user.level + 1);

    return {
      level: user.level,
      level_name: currentThreshold?.level_name ?? null, // ← 추가
      total_exp: user.exp,
      current_required_exp: currentThreshold?.required_exp ?? 0,
      next_required_exp: nextThreshold?.required_exp ?? null,
    };
  }
}
