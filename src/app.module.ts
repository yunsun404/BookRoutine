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
import { UserModule } from './user/user.module';
import { ReadingRoomModule } from './reading-room/reading-room.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BookshelfModule,
    ThreadsModule,
    ReadingGoalsModule,
    ThreadsAiModule,
    UserModule,
    ReadingRoomModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
})
export class AppModule {}
