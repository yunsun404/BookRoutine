import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BookshelfModule } from './bookshelf/bookshelf.module';
import { FirebaseService } from './firebase/firebase.service';
import { ThreadsModule } from './threads/threads.module';
import { ReadingGoalsModule } from './reading-goals/reading-goals.module';
import { ThreadsAiModule } from './threads-ai/threads-ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BookshelfModule,
    ThreadsModule,
    ReadingGoalsModule,
    ThreadsAiModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
})
export class AppModule {}