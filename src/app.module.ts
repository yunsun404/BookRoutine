import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';  // ← 추가
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseService } from './firebase/firebase.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ReadingRoomModule } from './reading-room/reading-room.module';
import { GroupController } from './group/group.controller';
import { GroupModule } from './group/group.module';
import { PrismaService } from './prisma/prisma.service';
import { GroupService } from './group/group.service';
import { QuestModule } from './quest/quest.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // ← added
    AuthModule,
    UserModule,
    ReadingRoomModule,
    GroupModule,
    QuestModule
  ],
  controllers: [AppController, GroupController],
  providers: [PrismaService, AppService, FirebaseService, GroupService],
})
export class AppModule { }