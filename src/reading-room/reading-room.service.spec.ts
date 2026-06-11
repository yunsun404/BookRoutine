import { Test, TestingModule } from '@nestjs/testing';
import { ReadingRoomService } from './reading-room.service';

describe('ReadingRoomService', () => {
  let service: ReadingRoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReadingRoomService],
    }).compile();

    service = module.get<ReadingRoomService>(ReadingRoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
