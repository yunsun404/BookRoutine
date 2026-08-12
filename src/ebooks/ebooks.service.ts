import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // 경로는 실제 프로젝트에 맞게 수정
import {
  EndReadingDto,
  FocusBatchDto,
  HistoryQueryDto,
  ListEbooksDto,
  StartReadingDto,
} from './dto/ebooks.dto';
import { computeFocusResult, computeReward } from './focus-score.util';

@Injectable()
export class EbooksService {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/v1/ebooks
  // content가 있는 Book만 "전자책"으로 취급
  async findAll(query: ListEbooksDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      content: { not: null },
      ...(query.category ? { book_category: query.category } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { author: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          book_id: true,
          title: true,
          author: true,
          cover_url: true,
          book_category: true,
          book_intro: true,
          total_pages: true,
          // content는 목록에서 굳이 안 내려줘도 됨 (상세 진입 시에만)
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // POST /api/v1/ebooks/reading
  async startSession(userId: string, dto: StartReadingDto) {
    const book = await this.prisma.book.findUnique({
      where: { book_id: dto.bookId },
    });
    if (!book) throw new NotFoundException('존재하지 않는 전자책입니다.');
    if (!book.content) {
      throw new BadRequestException('전자책 원문이 없는 도서입니다.');
    }

    // 이미 진행 중인 세션이 있으면 재사용 (중복 세션 방지)
    const existing = await this.prisma.ebookReadingSession.findFirst({
      where: { user_id: userId, book_id: dto.bookId, status: 'in_progress' },
    });
    if (existing) return existing;

    return this.prisma.ebookReadingSession.create({
      data: {
        user_id: userId,
        book_id: dto.bookId,
        status: 'in_progress',
      },
    });
  }

  // POST /api/v1/ebooks/reading/focus
  async appendFocusSamples(userId: string, dto: FocusBatchDto) {
    const session = await this.getOwnedSession(userId, dto.sessionId);
    if (session.status !== 'in_progress') {
      throw new BadRequestException('이미 종료된 세션입니다.');
    }
    if (dto.samples.length === 0) {
      return { accepted: 0 };
    }

    await this.prisma.ebookFocusLog.createMany({
      data: dto.samples.map((s) => ({
        session_id: dto.sessionId,
        bucket_start: new Date(s.bucketStart),
        bucket_end: new Date(s.bucketEnd),
        focused_ratio: s.focusedRatio,
        face_detected: s.faceDetected ?? true,
        interruption: s.interruption ?? false,
        avg_yaw: s.avgYaw,
        avg_pitch: s.avgPitch,
      })),
    });

    return { accepted: dto.samples.length };
  }

  // PATCH /api/v1/ebooks/reading/end
  async endSession(userId: string, dto: EndReadingDto) {
    const session = await this.getOwnedSession(userId, dto.sessionId);
    if (session.status !== 'in_progress') {
      throw new BadRequestException('이미 종료된 세션입니다.');
    }

    if (dto.samples && dto.samples.length > 0) {
      await this.appendFocusSamples(userId, {
        sessionId: dto.sessionId,
        samples: dto.samples,
      });
    }

    const allLogs = await this.prisma.ebookFocusLog.findMany({
      where: { session_id: dto.sessionId },
      orderBy: { bucket_start: 'asc' },
    });

    const result = computeFocusResult(allLogs);
    const reward = computeReward(result.avg_focus_score, result.total_focused_sec);
    // TODO: reward.reward_points / reward.reward_exp를 User 누적 포인트/경험치,
    // Ranking, Guidebook(캐릭터) 시스템에도 반영 (팀 스펙 확인 후 연동)

    return this.prisma.ebookReadingSession.update({
      where: { session_id: dto.sessionId },
      data: {
        status: 'completed',
        ended_at: new Date(),
        ...result,
        ...reward,
      },
    });
  }

  // GET /api/v1/ebooks/sessions/:sessionId/focus
  async getSessionFocusDetail(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    const timeline = await this.prisma.ebookFocusLog.findMany({
      where: { session_id: sessionId },
      orderBy: { bucket_start: 'asc' },
    });

    return { session, timeline };
  }

  // GET /api/v1/ebooks/me/history
  async getUserHistory(userId: string, query: HistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ebookReadingSession.findMany({
        where: { user_id: userId, status: { not: 'in_progress' } },
        include: { book: true },
        orderBy: { started_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ebookReadingSession.count({
        where: { user_id: userId, status: { not: 'in_progress' } },
      }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // GET /api/v1/ebooks/sessions/:sessionId/reward
  async getSessionReward(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    if (session.status !== 'completed') {
      throw new NotFoundException('아직 종료되지 않은 세션입니다.');
    }
    return {
      sessionId: session.session_id,
      rewardPoints: session.reward_points,
      rewardExp: session.reward_exp,
      avgFocusScore: session.avg_focus_score,
    };
  }

  private async getOwnedSession(userId: string, sessionId: string) {
    const session = await this.prisma.ebookReadingSession.findUnique({
      where: { session_id: sessionId },
    });
    if (!session) throw new NotFoundException('존재하지 않는 세션입니다.');
    if (session.user_id !== userId) {
      throw new ForbiddenException('본인의 세션만 조회할 수 있습니다.');
    }
    return session;
  }
}