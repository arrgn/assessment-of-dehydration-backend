import { Controller, Get, Param, Render } from '@nestjs/common';

@Controller('dehydration')
export class DehydrationController {
  @Get()
  @Render('main')
  getService() {
    return { message: `BMSTU Students!` };
  }

  @Get(':id')
  @Render('main')
  getServiceById(@Param('id') id: string) {
    return { message: `BMSTU Students! ${id}` };
  }

  @Get('add')
  @Render('add')
  getAddPage() {
    return {};
  }

  @Get('cards')
  @Render('cards')
  getCardsPage() {
    return {};
  }
}
