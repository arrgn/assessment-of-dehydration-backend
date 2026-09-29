import { Module } from '@nestjs/common';
import { DehydrationController } from './dehydration/dehydration.controller';
import { DehydrationModule } from './dehydration/dehydration.module';

@Module({
  imports: [DehydrationModule],
  controllers: [DehydrationController],
  providers: [],
})
export class AppModule {}
