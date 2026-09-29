import { Test, TestingModule } from '@nestjs/testing';
import { DehydrationService } from './dehydration.service';

describe('DehydrationService', () => {
  let service: DehydrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DehydrationService],
    }).compile();

    service = module.get<DehydrationService>(DehydrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
