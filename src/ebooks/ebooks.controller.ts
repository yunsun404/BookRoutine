import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 경로는 실제 프로젝트에 맞게 수정
import { CurrentUser } from '../auth/current-user.decorator'; // 경로는 실제 프로젝트에 맞게 수정
import { EbooksService } from './ebooks.service';
import {
  EndReadingDto,
  FocusBatchDto,
  HistoryQueryDto,
  ListEbooksDto,
  StartReadingDto,
} from './dto/ebooks.dto';

@Controller('api/v1/ebooks')
export class EbooksController {
  constructor(private readonly ebooksService: EbooksService) {}

  // 전자책 목록 조회
  @Get()
  findAll(@Query() query: ListEbooksDto) {
    return this.ebooksService.findAll(query);
  }

  // 전자책 독서 세션 시작
  @Post('reading')
  @UseGuards(JwtAuthGuard)
  startReading(@CurrentUser() user: { id: string }, @Body() dto: StartReadingDto) {
    return this.ebooksService.startSession(user.id, dto);
  }

  // 시선추적 집중도 데이터 전송 (배치)
  @Post('reading/focus')
  @UseGuards(JwtAuthGuard)
  sendFocus(@CurrentUser() user: { id: string }, @Body() dto: FocusBatchDto) {
    return this.ebooksService.appendFocusSamples(user.id, dto);
  }

  // 전자책 독서 세션 종료 (최종 결과 산출)
  @Patch('reading/end')
  @UseGuards(JwtAuthGuard)
  endReading(@CurrentUser() user: { id: string }, @Body() dto: EndReadingDto) {
    return this.ebooksService.endSession(user.id, dto);
  }

  // 세션별 집중도 상세조회
  @Get('sessions/:sessionId/focus')
  @UseGuards(JwtAuthGuard)
  getSessionFocus(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.ebooksService.getSessionFocusDetail(user.id, sessionId);
  }

  // 내 전자책 독서 이력 조회
  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  getHistory(@CurrentUser() user: { id: string }, @Query() query: HistoryQueryDto) {
    return this.ebooksService.getUserHistory(user.id, query);
  }

  // 세션 보상 지급 결과 조회
  @Get('sessions/:sessionId/reward')
  @UseGuards(JwtAuthGuard)
  getReward(@CurrentUser() user: { id: string }, @Param('sessionId') sessionId: string) {
    return this.ebooksService.getSessionReward(user.id, sessionId);
  }
}