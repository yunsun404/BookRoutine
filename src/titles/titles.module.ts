// titles/titles.module.ts
import { Module } from '@nestjs/common';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';
import { LevelModule } from '../level/level.module';

@Module({
  imports: [LevelModule], // titles가 level에 의존하는 부분
  controllers: [TitlesController],
  providers: [TitlesService],
  exports: [TitlesService], // user.controller.ts가 이걸 가져다 씀
})
export class TitlesModule {}