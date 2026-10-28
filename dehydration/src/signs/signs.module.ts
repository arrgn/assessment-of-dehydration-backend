import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DehydrationLike,
  DehydrationSign,
} from '../entities/dehydration.entity';
import { MinioModule } from '../minio/minio.module';
import { SignsController } from './signs.controller';
import { SignsService } from './signs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DehydrationSign, DehydrationLike]),
    MinioModule,
  ],
  controllers: [SignsController],
  providers: [SignsService],
})
export class SignsModule {}
