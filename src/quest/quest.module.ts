import { Module } from '@nestjs/common';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [QuestController],
  providers: [PrismaService, QuestService]
})
export class QuestModule { }
