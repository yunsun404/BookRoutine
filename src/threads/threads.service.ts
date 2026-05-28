import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThreadsService {
  constructor(private readonly prisma: PrismaService) {}

  create(body: any) {
    return this.prisma.thread.create({
      data: {
        user_id: body.user_id,
        book_id: body.book_id,
        group_id: body.group_id,
        content: body.content,
        current_page: body.current_page,
        is_public: body.is_public ?? true,
      },
    });
  }

  findAll(user_id?: string, book_id?: string) {
  return this.prisma.thread.findMany({
    where: {
      ...(user_id && { user_id }),
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

  async update(id: string, body: any) {
    await this.findOne(id);

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

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.thread.delete({
      where: {
        thread_id: id,
      },
    });
  }
}