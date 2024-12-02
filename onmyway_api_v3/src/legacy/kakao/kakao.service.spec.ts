import { Test, TestingModule } from '@nestjs/testing';
import { KakaoService } from './kakao.service';

describe('KakaoService', () => {
  let service: KakaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KakaoService],
    }).compile();

    service = module.get<KakaoService>(KakaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
