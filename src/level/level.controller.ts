// level/level.controller.ts
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LevelService } from './level.service';

@UseGuards(JwtAuthGuard)
@Controller('level')
export class LevelController {
  constructor(private levelService: LevelService) {}

  @Get('me')
  getMyLevel(@Request() req) {
    return this.levelService.getMyLevel(req.user.sub);
  }
}