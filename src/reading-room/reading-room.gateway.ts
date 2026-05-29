import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ namespace: 'reading-room', cors: { origin: '*' } })
export class ReadingRoomGateway {
    @WebSocketServer()
    server!: Server;

    @SubscribeMessage('joinRoom')
    handleJoinRoom(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.join(data.roomId);
        this.server.to(data.roomId).emit('userJoined', {
            message: `${client.id}가 입장했습니다.`,
            socketId: client.id
        });
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
        @MessageBody() data: { roomId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(data.roomId);
        this.server.to(data.roomId).emit('userLeft', {
            message: `${client.id}가 퇴장했습니다.`,
            socketId: client.id
        });
    }
}