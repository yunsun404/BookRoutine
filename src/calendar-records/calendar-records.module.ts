import { Module } from '@nestjs/common';
import { CalendarRecordsController } from './calendar-records.controller';
import { CalendarRecordsService } from './calendar-records.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CalendarRecordsController],
  providers: [CalendarRecordsService],
})
export class CalendarRecordsModule {}