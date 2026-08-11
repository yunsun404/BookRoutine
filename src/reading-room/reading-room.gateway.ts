import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'; 
import { ReadingRoomService } from './reading-room.service';

@WebSocketGateway({ 
    namespace: 'reading-room',
    cors: { origin: '*' }, // Expo 모바일 앱 및 웹 클라이언트 전면 개방
})
export class ReadingRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() 
    server!: Server;

    // 💡 팀원의 서비스 구조를 주입받아 내 비즈니스 로직을 온전히 연동
    constructor(private readonly readingRoomService: ReadingRoomService) {}

    // 유저가 소켓에 실시간으로 최초 연결되었을 때
    handleConnection(client: Socket) {
        console.log(`🔌 [실시간 독서방] 소켓 연결 성공 ID: ${client.id}`);
    }

    // 유저가 앱을 강제 종료하거나 이탈하여 소켓 단절이 일어났을 때 (비정상 퇴장 완벽 대응)
    async handleDisconnect(client: Socket) {
        console.log(`❌ [실시간 독서방] 소켓 연결 해제 ID: ${client.id}`);
        
        // 소켓 ID를 기반으로 인메모리 세션을 추적해 DB 퇴장 로그 적재 처리를 서비스에 위임
        const exitData = await this.readingRoomService.handleSocketDisconnect(client.id);

        if (exitData) {
            const { room_id, user_id } = exitData;
            console.log(`🚨 [퇴장 브로드캐스트] 룸 ${room_id}번방에서 유저 ${user_id} 세션 이탈 감지`);
            
            // 해당 룸 전체에 실시간 퇴장 이벤트 브로드캐스트
            this.server.to(room_id).emit('userExited', { user_id });
        }
    }

    // 📥 1. 독서방 입장 이벤트 수신 
    @SubscribeMessage('joinRoom') 
    async handleJoinRoom(
        // 프론트엔드 Expo 데이터 및 DB 컨벤션(_id) 일치화를 위해 카멜케이스를 스네이크 케이스로 통합 보정
        @MessageBody() data: { room_id: string; user_id: string; username: string }, 
        @ConnectedSocket() client: Socket,
    ) {
        const { room_id, user_id, username } = data; 
        // 1. Socket.io 자체 가상 룸(Room) 기능으로 클라이언트 격리 바인딩
        client.join(room_id);
        
        // 2. 서비스에 파라미터를 넘길 때 서비스 규격(socketId, roomId, userId, username)에 매핑 (entered_at)
        await this.readingRoomService.registerUserSession(client.id, room_id, user_id, username);

        console.log(`👥 [Room ${room_id}] 가상 룸 채널 안착 및 세션 등록: ${username} (${user_id})`);
        
        // 3. 방에 있는 '다른 참여자들'에게 실시간 UI 렌더링용 유저 상태 객체 및 메시지 전송
        client.to(room_id).emit('userJoined', { 
            user_id, 
            username, 
            status: 'reading', // 진입 시 기본값 설정
            message: `${username}님이 입장했습니다.` 
        });
    }

    // 📥 2. 실시간 집중도 변경 (Expo 미디어파이프가 상태 전환 감지 시 쏘는 이벤트 - 내 핵심 코드)
    @SubscribeMessage('updateStatus')
    async handleUpdateStatus(
        @MessageBody() data: { room_id: string; user_id: string; status: 'reading' | 'distracted' | 'sleeping' }, 
        @ConnectedSocket() client: Socket, 
    ) {
        const { room_id, user_id, status } = data;
        
        // Prisma를 활용하여 집중도 타임스탬프 로그를 수집하도록 서비스에 위임
        await this.readingRoomService.updateUserStatusLog(user_id, room_id, status);

        console.log(`🔄 [상태 변경 브로드캐스트] 유저 ${user_id} ➡️ ${status}`);

        // 나를 제외한 방 안의 모든 사람들의 화면 카드 테두리 및 배지 색상을 즉시 바꾸기 위해 브로드캐스팅
        client.to(room_id).emit('statusUpdated', { user_id, status });
    }

    // 📥 3. 독서방 수동 퇴장 이벤트 (팀원 코드 리팩토링 추가)
    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @MessageBody() data: { room_id: string; user_id: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { room_id, user_id } = data;
        
        client.leave(room_id);
        console.log(`🚪 [수동 퇴장] 방: ${room_id} | 유저: ${user_id}`);
        
        this.server.to(room_id).emit('userExited', { user_id });
    }
}