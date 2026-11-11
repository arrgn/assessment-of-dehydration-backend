import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '../entities/dehydration.entity';
import { SessionService } from '../auth/session.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

export interface UserResponse {
  id: number;
  name: string;
  login: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly sessions: SessionService,
  ) {}

  async register(dto: RegisterUserDto): Promise<UserResponse> {
    if (await this.userRepository.existsBy({ login: dto.login })) {
      throw new ConflictException('Пользователь с таким логином уже есть');
    }

    const user = await this.userRepository.save(
      this.userRepository.create({
        name: dto.name,
        login: dto.login,
        passwordHash: this.hashPassword(dto.password),
      }),
    );

    return {
      id: user.id,
      name: user.name,
      login: dto.login,
      createdAt: user.createdAt,
    };
  }

  async login(
    dto: LoginUserDto,
  ): Promise<{ sessionId: string; user: UserResponse }> {
    const user = await this.userRepository.findOneBy({ login: dto.login });
    if (
      !user?.passwordHash ||
      !this.verifyPassword(dto.password, user.passwordHash)
    ) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }
    const sessionId = await this.sessions.create(user.id);
    return {
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        login: user.login ?? dto.login,
        createdAt: user.createdAt,
      },
    };
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  }
}
