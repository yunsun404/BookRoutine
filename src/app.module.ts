import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';  // ← 추가
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseService } from './firebase/firebase.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // ← 추가
  ],
  controllers: [AppController],
  providers: [AppService, FirebaseService],
})
export class AppModule {}