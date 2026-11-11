import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/dehydration.entity';
import { SessionService } from './session.service';
import { OptionalSessionGuard, SessionGuard } from './session.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [SessionService, SessionGuard, OptionalSessionGuard],
  exports: [SessionService, SessionGuard, OptionalSessionGuard, TypeOrmModule],
})
export class AuthModule {}
