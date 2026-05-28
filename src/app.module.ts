import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';  // ← 추가
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseService } from './firebase/firebase.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ReadingRoomModule } from './reading-room/reading-room.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // ← added
    AuthModule,
    UserModule,
    ReadingRoomModule
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
})
export class AppModule { }