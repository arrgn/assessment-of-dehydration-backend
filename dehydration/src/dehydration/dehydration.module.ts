import { Module } from '@nestjs/common';
import { DehydrationService } from './dehydration.service';
import { DehydrationController } from './dehydration.controller';

@Module({
  controllers: [DehydrationController],
  providers: [DehydrationService],
})
export class DehydrationModule {}
