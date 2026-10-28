import { Type } from 'class-transformer';
import { IsIn } from 'class-validator';

export class LikeSignDto {
  @Type(() => Number)
  @IsIn([0, 1], { message: 'like должен быть 0 или 1' })
  like: 0 | 1;
}
