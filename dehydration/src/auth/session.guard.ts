import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/dehydration.entity';
import { AuthRequest } from './auth-user';
import { SESSION_COOKIE, SessionService } from './session.service';

/** Кладёт пользователя в request.user, если сессия валидна. Гостей пропускает. */
@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const sessionId = (req.cookies as Record<string, string> | undefined)?.[
      SESSION_COOKIE
    ];
    if (!sessionId) return true;

    const userId = await this.sessions.getUserId(sessionId);
    if (userId === null) return true;

    const user = await this.users.findOneBy({ id: userId });
    if (user) {
      req.user = { id: user.id, name: user.name, login: user.login };
    }
    return true;
  }
}

/** Требует авторизации: без валидной сессии — 401. */
@Injectable()
export class SessionGuard extends OptionalSessionGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const req = context.switchToHttp().getRequest<AuthRequest>();
    if (!req.user) {
      throw new UnauthorizedException('Требуется авторизация');
    }
    return true;
  }
}
