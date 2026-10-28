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
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { getCurrentUser } from '../common/current-user';
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

@Controller('dehydration')
export class SignsController {
  constructor(private readonly signsService: SignsService) {}

  @Get('signs')
  getSigns(@Query() filters: SignFiltersDto): Promise<SignList> {
    return this.signsService.getSigns(getCurrentUser().id, filters);
  }

  @Get(['feed', 'feed/:id'])
  getFeedCard(
    @Param('id', new ParseIntPipe({ optional: true })) id?: number,
    @Query('next', new ParseBoolPipe({ optional: true })) next?: boolean,
  ): Promise<SignFeedItem> {
    return this.signsService.getFeedCard(getCurrentUser().id, id, next);
  }

  @Get('add')
  getDraft(): Promise<SignResponse> {
    return this.signsService.getDraft(getCurrentUser().id);
  }

  @Post('add')
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
  ): Promise<SignResponse> {
    return this.signsService.createDraft(getCurrentUser().id, dto.title, files);
  }

  @Put('add')
  publish(@Body() dto: PublishSignDto): Promise<SignResponse> {
    return this.signsService.publish(getCurrentUser().id, dto);
  }

  @Delete('delete/:id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.signsService.remove(id, getCurrentUser().id);
  }

  @Post('like/:id')
  @HttpCode(200)
  setLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeSignDto,
  ): Promise<LikeResult> {
    return this.signsService.setLike(id, getCurrentUser().id, dto);
  }
}
