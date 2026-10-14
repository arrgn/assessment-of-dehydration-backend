import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DehydrationService } from './dehydration.service';
import { DehydrationController } from './dehydration.controller';
import {
  DehydrationSign,
  User,
  DehydrationLike,
} from './entities/dehydration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DehydrationSign, User, DehydrationLike])],
  controllers: [DehydrationController],
  providers: [DehydrationService],
})
export class DehydrationModule {}
