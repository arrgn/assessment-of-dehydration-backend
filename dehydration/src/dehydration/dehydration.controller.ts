import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Redirect,
  Render,
} from '@nestjs/common';
import { DehydrationService } from './dehydration.service';

@Controller('dehydration')
export class DehydrationController {
  constructor(private readonly dehydrationService: DehydrationService) {}

  private readonly currentUserId = 1;

  private readonly dehydrationMinIOSrc = 'http://localhost:9000/dehydration/';
  private readonly dehydrationHost = 'http://localhost:3000/dehydration/';

  private readonly defaultVidSrc = this.dehydrationMinIOSrc + 'thirst.mp4';
  private readonly defaultImgSrc = this.dehydrationMinIOSrc + 'thirst.jpg';

  private readonly stubVidSrc = 'not-uploaded.mp4';
  private readonly stubImgSrc = 'not-uploaded.jpg';

  private dehydrationMediaUrl(name: string | null, fallback: string): string {
    return name ? this.dehydrationMinIOSrc + name : fallback;
  }

  @Get('feed/:id')
  @Render('dehydrationFeed')
  async getDehydrationCardById(@Param('id', ParseIntPipe) id: number) {
    const sign = await this.dehydrationService.getActiveDehydrationSignFrom(id);

    if (!sign) {
      return {
        nextUrl: `${this.dehydrationHost}feed/0`,
        vidSrc: this.defaultVidSrc,
        imgSrc: this.defaultImgSrc,
        defaultVidSrc: this.defaultVidSrc,
        defaultImgSrc: this.defaultImgSrc,
      };
    }

    const vidSrc = this.dehydrationMediaUrl(sign.vidSrc, this.defaultVidSrc);
    const imgSrc = this.dehydrationMediaUrl(sign.imgSrc, this.defaultImgSrc);
    const nextUrl = `${this.dehydrationHost}feed/${sign.id + 1}`;
    const liked = await this.dehydrationService.isDehydrationSignLiked(
      this.currentUserId,
      sign.id,
    );

    return {
      sign,
      nextUrl,
      vidSrc,
      imgSrc,
      liked,
      defaultVidSrc: this.defaultVidSrc,
      defaultImgSrc: this.defaultImgSrc,
    };
  }

  @Get('add')
  @Render('dehydrationAdd')
  async getAddDehydrationCardPage() {
    const draft = await this.dehydrationService.getDehydrationDraft(
      this.currentUserId,
    );

    return { draft };
  }

  @Post('add')
  @Redirect('/dehydration/add')
  async createDehydrationDraft(@Body() body: { title?: string }) {
    const title = body.title?.trim();
    if (!title) throw new BadRequestException('Название обязательно');

    if (
      !(await this.dehydrationService.getDehydrationDraft(this.currentUserId))
    ) {
      await this.dehydrationService.createDehydrationDraft(this.currentUserId, {
        title,
        vidSrc: this.stubVidSrc,
        imgSrc: this.stubImgSrc,
      });
    }
  }

  @Post('publish')
  @Redirect('/dehydration/signs')
  async publishDehydrationSign(
    @Body('id', ParseIntPipe) id: number,
    @Body('title') title: string | undefined,
    @Body('description') description: string | undefined,
    @Body('dehydratingCoefficient', ParseIntPipe) coefficient: number,
    @Body('maxDehydratingCoefficient', ParseIntPipe) maxCoefficient: number,
  ) {
    if (!title?.trim() || !description?.trim()) {
      throw new BadRequestException('Заполните все поля');
    }

    await this.dehydrationService.publishDehydrationSign(
      id,
      this.currentUserId,
      {
        title: title.trim(),
        description: description.trim(),
        dehydratingCoefficient: coefficient,
        maxDehydratingCoefficient: maxCoefficient,
      },
    );
  }

  @Post('delete/:id')
  @Redirect('/dehydration/signs')
  async softDeleteDehydrationSign(@Param('id', ParseIntPipe) id: number) {
    await this.dehydrationService.softDeleteDehydrationSign(id);
  }

  @Get('signs')
  @Render('dehydrationSigns')
  async getDehydrationCardsPage(
    @Query('min', new ParseIntPipe({ optional: true })) minRaw?: number,
    @Query('max', new ParseIntPipe({ optional: true })) maxRaw?: number,
    @Query('search') search?: string,
  ) {
    const query = search?.trim();
    const sliderMax =
      await this.dehydrationService.getDehydrationMaxCoefficient(query);
    const clamp = (n: number) => Math.min(Math.max(n, 0), sliderMax);
    const from = clamp(minRaw ?? 0);
    const to = clamp(maxRaw ?? sliderMax);
    const min = Math.min(from, to);
    const max = Math.max(from, to);

    const hasFilter = min > 0 || max < sliderMax;
    const found = await this.dehydrationService.getDehydrationSignsWithLikes(
      query,
      hasFilter ? min : undefined,
      hasFilter ? max : undefined,
    );

    const signs = found.map((sign) => ({
      ...sign,
      imgSrc: this.dehydrationMediaUrl(sign.imgSrc, this.defaultImgSrc),
    }));

    return {
      signs,
      search: query,
      defaultImgSrc: this.defaultImgSrc,
      filters: {
        min,
        max,
        sliderMax,
        fillLeft: sliderMax ? (min / sliderMax) * 100 : 0,
        fillRight: sliderMax ? 100 - (max / sliderMax) * 100 : 0,
      },
    };
  }
}
