import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BookshelfModule } from './bookshelf/bookshelf.module';

@Module({
  imports: [
    // 기존 모듈들...
    AuthModule,
    BookshelfModule,
  ],
})
export class AppModule {}