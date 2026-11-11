import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  id: number;
  name: string;
  login: string | null;
}

export type AuthRequest = Request & { user?: AuthUser };

/** Текущий пользователь из сессии (в публичных методах может быть undefined). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined =>
    ctx.switchToHttp().getRequest<AuthRequest>().user,
);
