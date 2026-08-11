import { Module } from '@nestjs/common';
import { BookshelfController } from './bookshelf.controller';
import { BookshelfService } from './bookshelf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule,AuthModule],
  controllers: [BookshelfController],
  providers: [BookshelfService],
})
export class BookshelfModule {}
