import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [GroupController],
  providers: [GroupService, PrismaService]
})
export class GroupModule { }
