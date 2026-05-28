import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { AuthModule } from './auth/auth.module';
import { BookshelfModule } from './bookshelf/bookshelf.module';

@Module({
  imports: [
    // 기존 모듈들...
    AuthModule,
    BookshelfModule,
  ],
=======
import { ConfigModule } from '@nestjs/config';  // ← 추가
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseService } from './firebase/firebase.service';
import { ThreadsModule } from './threads/threads.module';
import { ReadingGoalsModule } from './reading-goals/reading-goals.module';
import { ThreadsAiModule } from './threads-ai/threads-ai.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThreadsModule, 
    ReadingGoalsModule, 
    ThreadsAiModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
>>>>>>> origin/back/thread
})
export class AppModule {}