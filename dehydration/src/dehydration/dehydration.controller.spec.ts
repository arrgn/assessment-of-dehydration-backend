import { Test, TestingModule } from '@nestjs/testing';
import { DehydrationController } from './dehydration.controller';

describe('DehydrationController', () => {
  let controller: DehydrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DehydrationController],
    }).compile();

    controller = module.get<DehydrationController>(DehydrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
