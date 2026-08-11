import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThreadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId, body: any) {
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
}
