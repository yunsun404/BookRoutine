import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // prisma 의존성 주입 (DI)

/*
reading-room.service : 
비즈니스 로직과 DB 조작은 서비스 파일에서 처리합니다. (Prisma 코드 이전)

* 참고
* 1. await는 프로미스 작업이 완료될 때까지 비동기 함수 실행을 일시 중지하고,
*    작업이 끝나면 결과를 반환하는 연산자이다. 
* * 특징
*    비동기 코드를 마치 동기 코드처럼 순차적으로 작성할 수 있게 하여 코드의 가독성을 크게 높여줍니다
*
* 즉, 위 비동기 registerUserSession 함수 실행을 일시 중지,
* try문 작업을 먼저 하는 건가? / await 줄을 먼저 실행하는 건가? 
*
* 2. NestJS(TypeScript) 내부에서는 
*    변수명: 카멜 케이스(roomId)를 쓰고, 
*    데이터베이스(Prisma/PostgreSQL) 테이블 필드: 스네이크 케이스(room_id)를 사용한다.
*/

export interface CreateRoom {
  group_name: string;
  group_id: string;
  max_users?: number;
}

@Injectable()
export class ReadingRoomService {
  // 실시간 소켓 연결 ID와 유저 매핑: 
  // 어떤 소켓(socketId)이 어떤 방(room_id)의 누구(user_id)인지 기억하는 인메모리 저장소
  // 인메모리 세션 저장소 타입: 카멜 케이스(roomId, userId)를 유지함. (참고)
  private activeSessions = new Map<string, { roomId: string; userId: string; username: string }>();
  /**
   * 사용자가 웹소켓 채널에 들어오면, 메모리상의 Map 공간에 [소켓 ID] -> {어떤 방, 어떤 유저} 형태로 연결 상태를 실시간 기록
   * 이후 유저가 앱을 툭 꺼버려서 소켓이 끊어지면(disconnect)
   * 서버는 끊어진 소켓 ID만 알 수 있습니다. 
   * 이때 메모리의 Map에서 소켓 ID를 조회(get)하여 특정 소켓 ID를 쓰던 
   * aaa 유저가 나간 것을 역추적하여 DB를 안전하게 청소하는 용도로 사용됩니다.
  */

  constructor(private readonly prisma: PrismaService) {} 
  // readonly: 읽기 전용이라는 키워드. 이 변수는 클래스가 처음 실행될 때 한 번 세팅되면, 내부의 다른 함수에서 절대로 다른 값으로 중간에 덮어쓸(수정할) 수 없다

  // =========================================================================
  // 1. [HTTP REST API] 방 생성 및 가입/조회 로직 
  // =========================================================================
  async createRoom(user_id: string, dto: CreateRoom) {
    // 💡 방어 코드 추가: 만약 group_id가 누락되었다면 에러를 먼저 내뿜도록 설계
    if (!dto.group_id) {
        throw new BadRequestException('그룹 ID는 필수 항목입니다.');
    }
    return await this.prisma.readingRoom.create({
        data: {
            room_name: dto.group_name,
            group_id: dto.group_id,
            book_id: undefined,
            max_users: dto.max_users || 6,
            started_by: user_id,
        },
    });
  }

  // HTTP를 통한 수동 방 입장 처리
  async joinRoom(user_id: string, room_id: string) {
      const room = await this.prisma.readingRoom.findUnique({ where: { room_id } });
      if (!room) throw new NotFoundException('존재하지 않는 독서방입니다.');

      // 💡 실제 사용하시는 readingRoomUser 테이블명 및 필드 구조 매핑
      const existing = await this.prisma.readingRoomUser.findFirst({
          where: { room_id: room_id, user_id: user_id }
      });

      if (existing) {
          return await this.prisma.readingRoomUser.update({
              where: { room_user_id: existing.room_user_id },
              data: { entered_at: new Date(), exited_at: null, status: 'reading' }
          });
      }

      return await this.prisma.readingRoomUser.create({
          data: {
              room_id: room_id,
              user_id: user_id,
              entered_at: new Date(),
              status: 'reading'
          },
      });
  }

  // HTTP를 통한 수동 방 퇴장 처리
  async leaveRoom(user_id: string, room_id: string) {
      try {
          const targetUser = await this.prisma.readingRoomUser.findFirst({
              where: { room_id: room_id, user_id: user_id, exited_at: null }
          });

          if (!targetUser) throw new BadRequestException('참여 정보가 없거나 이미 퇴장되었습니다.');

          return await this.prisma.readingRoomUser.update({
              where: { room_user_id: targetUser.room_user_id },
              data: { 
                  exited_at: new Date(),
                  status: 'offline'
              }
          });
      } catch (error) {
          throw new BadRequestException('퇴장 처리 중 오류가 발생했습니다.');
      }
  }

  async deleteRoom(user_id: string, room_id: string) {
      const room = await this.prisma.readingRoom.findUnique({ where: { room_id } });
      if (!room) throw new NotFoundException('방을 찾을 수 없습니다.');
      if (room.started_by !== user_id) throw new BadRequestException('방장만 방을 삭제할 수 있습니다.');

      return await this.prisma.readingRoom.delete({ where: { room_id } });
  }

  async getRoomByGroup(group_id: string) {
      return await this.prisma.readingRoom.findMany({
          where: { group_id },
          // dev 스키마 구조에 따라 참여자 목록을 함께 로드하도록 보정
          include: { ReadingRoomUser: true } 
      });
  }

  async getUsersInRoom(room_id: string) {
      return await this.prisma.readingRoomUser.findMany({
          where: { room_id },
          include: { users: true } 
      });
  }
  
  // =========================================================================
  // 2. [Websocket 연결] 핵심 로직
  // =========================================================================
  
  /**
   * [입장] 방 입장시(소켓 연결 시) 인메모리 세션 등록 및 DB 상태 최신화
   */
  async registerUserSession(socketId: string, roomId: string, userId: string, username: string) {
    // 1. 인메모리 세션에 등록 (추후 disconnect 시 추적용)
    this.activeSessions.set(socketId, { roomId, userId, username });

    try {
      // 2. 기존 게이트웨이에 있던 Prisma 입장 갱신 로직 
      //   : Prisma 조회 시 스네이크 케이스 필드(room_id, user_id)에 카멜케이스 변수(roomId, userId) 매핑 
      //     (readingRoomUser 구조)
      const existing = await this.prisma.readingRoomUser.findFirst({
        where: {room_id: roomId, user_id: userId} 
      })
    
      if (existing) {
        await this.prisma.readingRoomUser.update({
          where: {room_user_id: existing.room_user_id},
          data: {entered_at: new Date(), exited_at: null, status: 'reading'}
        });
      } else {
        // 만약 해당 방에 처음 참여하는 유저라면 새로 생성해 줍니다.
        await this.prisma.readingRoomUser.create({
          data: {
            room_id: roomId,
            user_id: userId,
            entered_at: new Date(),
            status: 'reading'
          }
        });
      }
      console.log(`[Prisma] 유저 ${username} 입장 상태 DB 반영 완료`);
    } catch (e) {
      console.error('Prisma 입장 데이터 갱신 에러:', e);
    }
  }

  /**
   * [상태 변경] AI 판정 집중도가 바뀔 때마다 DB status 필드 실시간 업데이트
   *    (readingRoomUser의 status)
   */
  async updateUserStatusLog(userId: string, roomId: string, status: string) {
    try {
      // 기존 게이트웨이에 있던 updateStatus 내 Prisma 로직
      const targetUser = await this.prisma.readingRoomUser.findFirst({
          where: { room_id: roomId, user_id: userId },
      });
      if (targetUser) {
        await this.prisma.readingRoomUser.update({ // db status update
          where: { room_user_id: targetUser.room_user_id },
          data: { status: status },
        });
        console.log(`[Prisma] 유저 ${userId} -> ${status} 상태 저장 완료`);
      }

      /* 💡 [아키텍처 팁] 만약 실시간 상태 변경 흐름을 누적하여 통계를 내고 싶다면,
      나중에 Prisma 스키마에 focus_logs 같은 시계열 테이블을 추가하고 아래처럼 함께 insert 해주면 좋습니다.
      ex) await this.prisma.focus_logs.create({ data: { user_id: userId, status, created_at: new Date() } });

      // 1. 참여자 현재 상태 데드락 방지용 업데이트
      await this.prisma 
        .from('room_participants')
        .update({ status: status })
        .eq('user_id', userId);

      // 2. 통계 처리를 위한 시계열 로그 적재 테이블(예: focus_logs)에 인서트
      await this.supabase
        .from('focus_logs')
        .insert({
          user_id: userId,
          room_id: roomId,
          status: status,
          created_at: new Date()
        });  */
    } catch (error) {
      console.error('상태 업데이트 중 Prisma DB 에러 발생:', error);
    }
  }

  /**
   * [퇴장] 앱 종료 등으로 소켓 단절 시 세션 제거 및 오프라인 상태 처리
   */
  async handleSocketDisconnect(socketId: string) {
    // 1. 소켓 ID로 인메모리에 저장된 유저 세션 탐색
    const session = this.activeSessions.get(socketId);
    if (!session) return null;

    const { roomId, userId } = session;

    // 2. 인메모리 세션에서 제거
    this.activeSessions.delete(socketId);

    try {
      // 3. 아직 퇴장 안 한 데이터를 찾아 마감 시간 및 offline 처리
      const targetUser = await this.prisma.readingRoomUser.findFirst({
        where: {room_id: roomId, user_id: userId, exited_at: null} // 아직 퇴장 안 한 데이터 찾기
      });
      if (targetUser) {
        await this.prisma.readingRoomUser.update({
          where: { room_user_id: targetUser.room_user_id },
          data: { 
            exited_at: new Date(),
            status: 'offline' // 상태를 오프라인으로 변경
          },
        });
        console.log(`[Prisma] 유저 ${userId} 퇴장 시간 및 offline 상태 기록 완료.`);
      } 
    } catch (error) {
        console.error('비정상 퇴장 처리 중 Prisma DB 에러 발생:', error);
    }

    // 게이트웨이가 다른 유저들에게 'userExited' 이벤트를 브로드캐스트할 수 있도록 방 정보 반환
    return { room_id: roomId, user_id: userId};
  }
}