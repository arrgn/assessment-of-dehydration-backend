import { Controller, Get, Param, Query, Render } from '@nestjs/common';

@Controller('dehydration')
export class DehydrationController {
  private readonly clinicalSigns = [
    {
      id: 0,
      title: 'Жажда',
      description: 'Самый первый признак дегидрации пациента',
      power: 'явно',
      price: 10,
      vidSrc: 'thirst.mp4',
      imgSrc: 'thirst.jpg',
      status: 'Опубликован',
    },
    {
      id: 1,
      title: 'Эластичность кожи',
      description:
        'Важный параметр при оценке дегидрации. Кожная складка расправляется медленно.',
      power: 'умеренно',
      price: 75,
      vidSrc: 'skin-turgor.mp4',
      imgSrc: 'skin-turgor.jpg',
      status: 'Опубликован',
    },
    {
      id: 2,
      title: 'Состояние глазных яблок',
      description: 'Запавшие глазные яблоки, снижение тургора и сухость склер.',
      power: 'умеренно',
      price: 125,
      vidSrc: 'sunken-eyes.mp4',
      imgSrc: 'sunken-eyes.jpg',
      status: 'Опубликован',
    },
    {
      id: 3,
      title: 'Диурез',
      description:
        'Снижение объёма выделяемой мочи, тёмный цвет и высокая концентрация.',
      power: 'явно',
      price: 125,
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
      power: 'слабо',
      price: 50,
      vidSrc: 'dry-mucosa.mp4',
      imgSrc: 'dry-mucosa.jpg',
      status: 'Удален',
    },
  ];

  private readonly minIOSrc = 'http://localhost:9000/dehydration/';
  private readonly host = 'http://localhost:3000/dehydration/';

  @Get('feed/:id')
  @Render('feed')
  getServiceById(@Param('id') id: number) {
    while (
      id < this.clinicalSigns.length &&
      this.clinicalSigns[id].status == 'Удален'
    ) {
      id++;
    }

    if (id >= this.clinicalSigns.length) return null;

    const sign = this.clinicalSigns[id];
    const vidSrc = this.minIOSrc + sign.vidSrc;
    const imgSrc = this.minIOSrc + sign.imgSrc;
    const nextUrl = `${this.host}feed/${+id + 1}`;

    return { sign, nextUrl, vidSrc, imgSrc };
  }

  @Get('add')
  @Render('add')
  getAddPage() {
    const draft = this.clinicalSigns.find((sign) => sign.status == 'Черновик');

    return { draft };
  }

  @Get('signs')
  @Render('signs')
  getCardsPage(@Query('min') minRaw?: string, @Query('max') maxRaw?: string) {
    const min = this.parseNumber(minRaw);
    const max = this.parseNumber(maxRaw);

    const hasFilter = min !== null || max !== null;

    const signs = this.clinicalSigns
      .filter((sign) => sign.status !== 'Удален')
      .filter((sign) => {
        if (!hasFilter) return true;

        if (sign.price === undefined || sign.price === null) return false;

        if (min !== null && sign.price < min) return false;
        if (max !== null && sign.price > max) return false;

        return true;
      })
      .map((sign) => ({
        ...sign,
        imgSrc: this.minIOSrc + sign.imgSrc,
        likes: 15,
      }));

    return {
      signs,
      filters: {
        min: minRaw ?? '',
        max: maxRaw ?? '',
      },
    };
  }

  private parseNumber(raw?: string): number | null {
    if (raw === undefined || raw === null || raw.trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}
