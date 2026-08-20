// titles/titles.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LevelService } from '../level/level.service';

@Injectable()
export class TitlesService {
  constructor(
    private prisma: PrismaService,
    private levelService: LevelService,
  ) {}

  async getMyTitles(userId: string) {
    const { level } = await this.levelService.getMyLevel(userId);
    const allTitles = await this.prisma.title.findMany({ orderBy: { required_level: 'asc' } });
    const representative = await this.prisma.userRepresentativeTitle.findUnique({
      where: { user_id: userId },
    });

    return allTitles.map((t) => ({
      ...t,
      is_acquired: level >= t.required_level,
      is_representative: representative?.title_id === t.title_id,
    }));
  }

  async setRepresentativeTitle(userId: string, titleId: string) {
    const { level } = await this.levelService.getMyLevel(userId);
    const title = await this.prisma.title.findUniqueOrThrow({ where: { title_id: titleId } });

    if (level < title.required_level) {
      throw new BadRequestException('아직 획득하지 않은 칭호입니다.');
    }

    return this.prisma.userRepresentativeTitle.upsert({
      where: { user_id: userId },
      update: { title_id: titleId },
      create: { user_id: userId, title_id: titleId },
    });
  }
}