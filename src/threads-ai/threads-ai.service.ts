import { BadGatewayException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThreadsAiService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(body: { thread_id: string; text: string }) {
    if (!body.text || !body.text.trim()) {
      throw new BadGatewayException('요약할 텍스트가 없습니다.');
    }

    const res = await fetch('http://localhost:7860/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body.text }),
    });

    if (!res.ok) {
      throw new BadGatewayException('AI 요약 서버 요청 실패');
    }

    const data = await res.json();

    if (!data.summary) {
      throw new BadGatewayException('AI 요약 결과가 없습니다.');
    }

    const saved = await this.prisma.aiThreadSummary.create({
      data: {
        thread_id: body.thread_id,
        summary: data.summary,
      },
    });

    return {
      summary: saved.summary,
      thread_id: saved.thread_id,
      created_at: saved.created_at,
    };
  }
}