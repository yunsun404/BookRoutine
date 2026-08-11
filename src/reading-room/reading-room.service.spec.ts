import { Test, TestingModule } from '@nestjs/testing';
import { ReadingRoomService } from './reading-room.service';
import { PrismaService } from '../prisma/prisma.service'; // 💡 PrismaService 경로 반영

describe('ReadingRoomService', () => {
  let service: ReadingRoomService;

  // 💡 Prisma DB를 실제로 건드리지 않고, 테스트 컴파일용으로 통과만 시켜줄 가짜 객체 정의
  const mockPrismaService = {
    readingRoom: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    readingRoomUser: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingRoomService,
        // 💡 중요: 서비스가 정상 작동할 수 있도록 가짜 Prisma 공급자 주입!
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReadingRoomService>(ReadingRoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
