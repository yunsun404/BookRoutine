import { Test, TestingModule } from '@nestjs/testing';
import { ReadingRoomController } from './reading-room.controller';

describe('ReadingRoomController', () => {
  let controller: ReadingRoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReadingRoomController],
    }).compile();

    controller = module.get<ReadingRoomController>(ReadingRoomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
