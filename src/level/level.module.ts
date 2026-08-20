// level/level.module.ts
import { Module } from '@nestjs/common';
import { LevelController } from './level.controller';
import { LevelService } from './level.service';

@Module({
  controllers: [LevelController],
  providers: [LevelService],
  exports: [LevelService], // titles 모듈이 이걸 가져다 씀
})
export class LevelModule {}