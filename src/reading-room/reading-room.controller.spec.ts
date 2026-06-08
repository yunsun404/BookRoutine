import { Test, TestingModule } from '@nestjs/testing';
import { ReadingRoomController } from './reading-room.controller';
import { ReadingRoomService } from './reading-room.service';

describe('ReadingRoomController', () => {
  let controller: ReadingRoomController;

  const mockReadingRoomService = {
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    deleteRoom: jest.fn(),
    getRoomByGroup: jest.fn(),
    getUsersInRoom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadingRoomController],
      // 💡 의존성 에러 방지를 위해 mock 공급자 선언 추가
      providers: [
        {
          provide: ReadingRoomService,
          useValue: mockReadingRoomService,
        },
      ],
    }).compile();

    controller = module.get<ReadingRoomController>(ReadingRoomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});