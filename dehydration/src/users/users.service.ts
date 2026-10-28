import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scryptSync } from 'node:crypto';
import { Repository } from 'typeorm';
import { User } from '../entities/dehydration.entity';
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

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
  }
}
