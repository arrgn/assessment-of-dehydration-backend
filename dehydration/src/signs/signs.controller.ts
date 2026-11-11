import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { type AuthUser, CurrentUser } from '../auth/auth-user';
import { OptionalSessionGuard, SessionGuard } from '../auth/session.guard';
import { SESSION_COOKIE } from '../auth/session.service';
import { CreateSignDto } from './dto/create-sign.dto';
import { LikeSignDto } from './dto/like-sign.dto';
import { PublishSignDto } from './dto/publish-sign.dto';
import { SignFiltersDto } from './dto/sign-filters.dto';
import {
  LikeResult,
  SignFeedItem,
  SignList,
  SignResponse,
} from './sign-response';
import { SignsService, type SignFiles } from './signs.service';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

@ApiTags('Услуги')
@Controller('dehydration')
export class SignsController {
  constructor(private readonly signsService: SignsService) {}

  @Get('signs')
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({
    summary: 'Список услуг',
    description:
      'Опубликованные услуги с фильтрами search/min/max. Доступно гостям; для авторизованных isMine отмечает свои услуги.',
  })
  getSigns(
    @Query() filters: SignFiltersDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SignList> {
    return this.signsService.getSigns(user?.id, filters);
  }

  @Get(['feed', 'feed/:id'])
  @UseGuards(OptionalSessionGuard)
  @ApiOperation({
    summary: 'Лента услуг',
    description:
      'Без id — первая карточка; с id — карточка с этим id, а с `?next=true` — следующая за ним. Доступно гостям.',
  })
  getFeedCard(
    @Param('id', new ParseIntPipe({ optional: true })) id?: number,
    @Query('next', new ParseBoolPipe({ optional: true })) next?: boolean,
    @CurrentUser() user?: AuthUser,
  ): Promise<SignFeedItem> {
    return this.signsService.getFeedCard(user?.id, id, next);
  }

  @Get('add')
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiUnauthorizedResponse({ description: 'Требуется авторизация' })
  @ApiOperation({
    summary: 'Получить черновик',
    description: 'Черновик текущего пользователя (создателя).',
  })
  getDraft(@CurrentUser() user: AuthUser): Promise<SignResponse> {
    return this.signsService.getDraft(user.id);
  }

  @Post('add')
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiUnauthorizedResponse({ description: 'Требуется авторизация' })
  @ApiOperation({
    summary: 'Создать черновик услуги',
    description:
      'Создаёт черновик с картинкой и видео. Создатель подставляется автоматически из сессии.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'image', 'video'],
      properties: {
        title: { type: 'string', example: 'Сухие губы' },
        image: { type: 'string', format: 'binary' },
        video: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } },
    ),
  )
  createDraft(
    @Body() dto: CreateSignDto,
    @UploadedFiles() files: SignFiles,
    @CurrentUser() user: AuthUser,
  ): Promise<SignResponse> {
    return this.signsService.createDraft(user.id, dto.title, files);
  }

  @Put('add')
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiUnauthorizedResponse({ description: 'Требуется авторизация' })
  @ApiOperation({
    summary: 'Опубликовать услугу',
    description:
      'Заполняет поля черновика текущего пользователя и публикует его.',
  })
  publish(
    @Body() dto: PublishSignDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SignResponse> {
    return this.signsService.publish(user.id, dto);
  }

  @Delete('delete/:id')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiUnauthorizedResponse({ description: 'Требуется авторизация' })
  @ApiOperation({
    summary: 'Удалить услугу',
    description: 'Помечает свою услугу удалённой (только создатель).',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.signsService.remove(id, user.id);
  }

  @Post('like/:id')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiUnauthorizedResponse({ description: 'Требуется авторизация' })
  @ApiOperation({
    summary: 'Поставить/снять лайк',
    description: 'like=1 — поставить, like=0 — снять.',
  })
  setLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeSignDto,
    @CurrentUser() user: AuthUser,
  ): Promise<LikeResult> {
    return this.signsService.setLike(id, user.id, dto);
  }
}
