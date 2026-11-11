import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  SESSION_COOKIE,
  SESSION_TTL_SEC,
  SessionService,
} from '../auth/session.service';
import { SessionGuard } from '../auth/session.guard';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponse, UsersService } from './users.service';

@ApiTags('Пользователи')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessions: SessionService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Регистрация',
    description: 'Создаёт нового пользователя. Пароль хранится в виде хеша.',
  })
  @ApiConflictResponse({ description: 'Логин уже занят' })
  register(@Body() dto: RegisterUserDto): Promise<UserResponse> {
    return this.usersService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Аутентификация',
    description:
      'Проверяет логин и пароль, создаёт сессию в Redis и устанавливает HttpOnly-куку `sessionId`.',
  })
  @ApiOkResponse({ description: 'Успешный вход, кука sessionId установлена' })
  @ApiUnauthorizedResponse({ description: 'Неверный логин или пароль' })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponse> {
    const { sessionId, user } = await this.usersService.login(dto);
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_TTL_SEC * 1000,
    });
    return user;
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary: 'Деавторизация',
    description: 'Удаляет сессию из Redis и очищает куку.',
  })
  @ApiUnauthorizedResponse({ description: 'Нет активной сессии' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const sessionId = (req.cookies as Record<string, string>)[SESSION_COOKIE];
    await this.sessions.destroy(sessionId);
    res.clearCookie(SESSION_COOKIE);
    return { message: 'Вы вышли из системы' };
  }
}
