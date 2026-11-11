import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn } from 'class-validator';

export class LikeSignDto {
  @ApiProperty({ description: '1 — поставить лайк, 0 — снять', example: 1 })
  @Type(() => Number)
  @IsIn([0, 1], { message: 'like должен быть 0 или 1' })
  like: 0 | 1;
}
