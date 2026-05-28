import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThreadsAiService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(body: { thread_id: string; text: string }) {
    const res = await fetch('http://localhost:7860/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body.text }),
    });

    const data = await res.json();

    const saved = await this.prisma.aiThreadSummary.create({
      data: {
        thread_id: body.thread_id,
        summary: data.summary,
      },
    });

    return saved;
  }
}