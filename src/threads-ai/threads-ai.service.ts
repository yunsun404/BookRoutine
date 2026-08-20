import { NotFoundException, BadGatewayException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThreadsAiService {
  constructor(private readonly prisma: PrismaService) { }

  async summary(body: { thread_id?: string; book_id: string }) {
    // 1. 해당 book_id를 가진 모든 타래를 시간순으로 가져옵니다.
    const threads = await this.prisma.thread.findMany({
      where: { book_id: body.book_id },
      orderBy: { created_at: 'asc' },
    });

    // ⭐ 타래가 없을 경우 404 Not Found 에러 반환
    if (!threads || threads.length === 0) {
      throw new NotFoundException('해당 책에 등록된 타래가 없어 요약할 수 없습니다.');
    }

    // 2. 모든 타래의 content를 하나로 합칩니다.
    const combinedContent = threads.map((t) => t.content).join('\n\n');

    // 3. AI 서버에 텍스트 전달
    const res = await fetch('http://localhost:7860/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: combinedContent }),
    });

    if (!res.ok) {
      throw new BadGatewayException('AI 요약 서버 연결에 실패했습니다.');
    }

    const data = await res.json();

    // 4. 요약 결과 저장
    const saved = await this.prisma.aiThreadSummary.create({
      data: {
        summary: data.summary,
        book_id: body.book_id,
        thread: {
          connect: { thread_id: threads[0].thread_id },
        },
      },
    });

    return {
      summary: saved.summary,
      book_id: saved.book_id,
    };
  }
}