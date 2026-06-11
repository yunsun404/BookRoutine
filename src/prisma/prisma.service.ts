import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // 어플리케이션이 종료될 때 안전하게 연결을 해제합니다.
    async onModuleDestroy() {
        await this.$disconnect();
    }
}
