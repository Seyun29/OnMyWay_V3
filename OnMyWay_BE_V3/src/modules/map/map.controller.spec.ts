import { Test, TestingModule } from '@nestjs/testing';
import { MapController } from './map.controller';
import { MapModule } from './map.module';

describe('MapController', () => {
  let controller: MapController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MapModule],
    }).compile();

    controller = module.get<MapController>(MapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
