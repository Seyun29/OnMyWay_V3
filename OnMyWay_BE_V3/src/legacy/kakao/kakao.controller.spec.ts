import { Test, TestingModule } from '@nestjs/testing';
import { KakaoController } from './kakao.controller';

describe('KakaoController', () => {
  let controller: KakaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KakaoController],
    }).compile();

    controller = module.get<KakaoController>(KakaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
