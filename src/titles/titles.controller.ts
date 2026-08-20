// titles/titles.controller.ts
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TitlesService } from './titles.service';

@UseGuards(JwtAuthGuard)
@Controller('titles')
export class TitlesController {
  constructor(private titlesService: TitlesService) {}

  @Get()
  getMyTitles(@Request() req) {
    return this.titlesService.getMyTitles(req.user.sub);
  }
}