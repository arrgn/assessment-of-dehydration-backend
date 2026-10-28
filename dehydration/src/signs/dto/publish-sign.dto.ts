import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class PublishSignDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Название обязательно' })
  @MaxLength(255)
  title: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Описание обязательно' })
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(32767)
  dehydratingCoefficient: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(32767)
  maxDehydratingCoefficient: number;
}
