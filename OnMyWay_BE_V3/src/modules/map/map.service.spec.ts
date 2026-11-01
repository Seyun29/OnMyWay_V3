import { Test, TestingModule } from '@nestjs/testing';
import { MapService } from './map.service';
import { MapModule } from './map.module';

describe('MapService', () => {
  let service: MapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MapModule],
    }).compile();

    service = module.get<MapService>(MapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
