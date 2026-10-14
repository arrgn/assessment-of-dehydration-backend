import { Controller, Get, Param, Query, Render } from '@nestjs/common';

@Controller('dehydration')
export class DehydrationController {
  private readonly clinicalSigns = [
    {
      id: 0,
      title: 'Жажда',
      description: 'Самый первый признак дегидрации пациента',
      dehydratingCoefficient: 8,
      maxDehydratingCoefficient: 10,
      vidSrc: 'thirst.mp4',
      imgSrc: 'thirst.jpg',
      status: 'Опубликован',
    },
    {
      id: 1,
      title: 'Эластичность кожи',
      description:
        'Важный параметр при оценке дегидрации. Кожная складка расправляется медленно.',
      dehydratingCoefficient: 5,
      maxDehydratingCoefficient: 10,
      vidSrc: 'skin-turgor.mp4',
      imgSrc: 'skin-turgor.jpg',
      status: 'Опубликован',
    },
    {
      id: 2,
      title: 'Состояние глазных яблок',
      description: 'Запавшие глазные яблоки, снижение тургора и сухость склер.',
      dehydratingCoefficient: 6,
      maxDehydratingCoefficient: 10,
      vidSrc: 'sunken-eyes.mp4',
      imgSrc: 'sunken-eyes.jpg',
      status: 'Опубликован',
    },
    {
      id: 3,
      title: 'Диурез',
      description:
        'Снижение объёма выделяемой мочи, тёмный цвет и высокая концентрация.',
      dehydratingCoefficient: 7,
      maxDehydratingCoefficient: 10,
      vidSrc: 'diuresis.mp4',
      imgSrc: 'diuresis.jpg',
      status: 'Опубликован',
    },
    {
      id: 4,
      title: 'Судороги',
      description:
        'Болезненные мышечные спазмы на фоне электролитных нарушений.',
      vidSrc: 'cramps.mp4',
      imgSrc: 'cramps.jpg',
      status: 'Черновик',
    },
    {
      id: 5,
      title: 'Сухость слизистых',
      description:
        'Сухость языка, губ и ротовой полости — ранний признак обезвоживания.',
      dehydratingCoefficient: 3,
      maxDehydratingCoefficient: 10,
      vidSrc: 'dry-mucosa.mp4',
      imgSrc: 'dry-mucosa.jpg',
      status: 'Удален',
    },
  ];

  private readonly dehydrationLikes = [
    { userId: 1, signId: 0 },
    { userId: 2, signId: 0 },
    { userId: 3, signId: 0 },
    { userId: 1, signId: 1 },
    { userId: 4, signId: 1 },
    { userId: 2, signId: 2 },
    { userId: 3, signId: 2 },
    { userId: 4, signId: 2 },
    { userId: 5, signId: 2 },
    { userId: 1, signId: 3 },
    { userId: 5, signId: 4 },
    { userId: 2, signId: 5 },
  ];

  private readonly currentUserId = 1;

  private readonly dehydrationMinIOSrc = 'http://localhost:9000/dehydration/';
  private readonly dehydrationHost = 'http://localhost:3000/dehydration/';

  @Get('feed/:id')
  @Render('dehydrationFeed')
  getDehydrationCardById(@Param('id') id: number) {
    while (
      id < this.clinicalSigns.length &&
      this.clinicalSigns[id].status == 'Удален'
    ) {
      id++;
    }

    if (id >= this.clinicalSigns.length) return null;

    const sign = this.clinicalSigns[id];
    const vidSrc = this.dehydrationMinIOSrc + sign.vidSrc;
    const imgSrc = this.dehydrationMinIOSrc + sign.imgSrc;
    const nextUrl = `${this.dehydrationHost}feed/${+id + 1}`;

    const liked = this.dehydrationLikes.some(
      (like) => like.signId === sign.id && like.userId === this.currentUserId,
    );

    return { sign, nextUrl, vidSrc, imgSrc, liked };
  }

  @Get('add')
  @Render('dehydrationAdd')
  getAddDehydrationCardPage() {
    const draft = this.clinicalSigns.find((sign) => sign.status == 'Черновик');

    return { draft };
  }

  @Get('signs')
  @Render('dehydrationSigns')
  getDehydrationCardsPage(
    @Query('min') minRaw?: string,
    @Query('max') maxRaw?: string,
  ) {
    const sliderMax = Math.max(
      0,
      ...this.clinicalSigns
        .filter((sign) => sign.status !== 'Удален')
        .map((sign) => sign.dehydratingCoefficient ?? 0),
    );
    const clamp = (n: number) => Math.min(Math.max(n, 0), sliderMax);
    const from = clamp(this.parseNumber(minRaw) ?? 0);
    const to = clamp(this.parseNumber(maxRaw) ?? sliderMax);
    // Ползунки могут быть перетянуты друг через друга — упорядочиваем значения
    const min = Math.min(from, to);
    const max = Math.max(from, to);

    const hasFilter = min > 0 || max < sliderMax;

    const signs = this.clinicalSigns
      .filter((sign) => sign.status !== 'Удален')
      .filter((sign) => {
        if (!hasFilter) return true;

        if (
          sign.dehydratingCoefficient === undefined ||
          sign.dehydratingCoefficient === null
        )
          return false;

        if (sign.dehydratingCoefficient < min) return false;
        if (sign.dehydratingCoefficient > max) return false;

        return true;
      })
      .map((sign) => ({
        ...sign,
        imgSrc: this.dehydrationMinIOSrc + sign.imgSrc,
        likes: this.dehydrationLikes.filter((like) => like.signId === sign.id)
          .length,
      }));

    return {
      signs,
      filters: {
        min,
        max,
        sliderMax,
        fillLeft: sliderMax ? (min / sliderMax) * 100 : 0,
        fillRight: sliderMax ? 100 - (max / sliderMax) * 100 : 0,
      },
    };
  }

  private parseNumber(raw?: string): number | null {
    if (raw === undefined || raw === null || raw.trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}
