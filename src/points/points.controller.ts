// points/points.controller.ts
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PointsService } from './points.service';

@UseGuards(JwtAuthGuard)
@Controller('points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  @Get('me')
  getMyPoint(@Request() req) {
    return this.pointsService.getMyTotalPoint(req.user.sub);
  }

  @Get('logs')
  getMyLogs(@Request() req) {
    return this.pointsService.getMyLogs(req.user.sub);
  }
}