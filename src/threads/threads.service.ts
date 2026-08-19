import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable() // 이 클래스를 다른 곳에서 쓸 수 있도록 주입 가능한 부품으로 선언
export class ThreadsService {
  // Prisma(데이터베이스 도구)를 이 서비스 안에서 쓸 수 있게 가져옴
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, body: any) {
    return this.prisma.thread.create({
      data: {
        user_id: userId,
        book_id: body.book_id,
        group_id: body.group_id,
        content: body.content,
        current_page: body.current_page,
        is_public: body.is_public ?? true,
      },
    });
  }

  findAll(userId?: string, book_id?: string) {
    return this.prisma.thread.findMany({
      where: {
        ...(userId && { user_id: userId }),
        ...(book_id && { book_id }),
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const thread = await this.prisma.thread.findUnique({
      where: {
        thread_id: id,
      },
    });

    if (!thread) {
      throw new NotFoundException('타래를 찾을 수 없습니다.');
    }

    return thread;
  }

  async update(id: string, userId: string, body: any) {
    const thread = await this.findOne(id);
    if (String(thread.user_id) !== userId) throw new ForbiddenException();

    return this.prisma.thread.update({
      where: {
        thread_id: id,
      },
      data: {
        content: body.content,
        current_page: body.current_page,
        is_public: body.is_public,
      },
    });
  }

  async remove(id: string, userId: string) {
    const thread = await this.findOne(id);
    if (String(thread.user_id) !== userId) throw new ForbiddenException();

    return this.prisma.thread.delete({
      where: {
        thread_id: id,
      },
    });
  }

  // 🔴 컨트롤러 에러 해결을 위해 추가한 빈 메서드들 (추후 실제 DB 로직 구현 필요)
  async findMyThreads(userId: string) {
    return this.prisma.thread.findMany({
      where: { user_id: userId },
    });
  }

  async createReply(threadId: string, userId: string, body: any) {
    // 추후 답글 테이블(Reply)이 생기면 여기에 Prisma 로직 작성
    return { message: '답글 생성 기능 구현 예정', threadId, userId, body };
  }

  async createGroupThread(groupId: string, userId: string, body: any) {
    return this.prisma.thread.create({
      data: {
        user_id: userId,
        group_id: groupId,
        book_id: body.book_id,
        content: body.content,
        current_page: body.current_page,
      },
    });
  }

// 9. 그룹 타래 조회 (그룹원들이 시간순으로 볼 수 있도록 타임라인 형태로 조회)
  async findGroupThreads(groupId: string) {
    return this.prisma.thread.findMany({
      where: {
        group_id: groupId,
      },
      orderBy: {
        created_at: 'asc', // 시간순(오래된 순) 또는 최신순('desc') 원하시는 대로 설정 가능
      },
      include: {
        user: {
          select: {
            nickname: true,
            profile_image: true,
          },
        },
      },
    });
  }
}