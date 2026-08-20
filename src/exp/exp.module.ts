// exp/exp.module.ts
import { Module } from '@nestjs/common';
import { ExpService } from './exp.service';

@Module({
  providers: [ExpService],
  exports: [ExpService],
})
export class ExpModule {}