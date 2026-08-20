import { Module } from '@nestjs/common';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

import { PointsModule } from '../points/points.module';
import { ExpModule } from '../exp/exp.module'; 

@Module({
  imports: [PrismaModule,AuthModule,PointsModule,ExpModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
})
export class ChecklistsModule {}