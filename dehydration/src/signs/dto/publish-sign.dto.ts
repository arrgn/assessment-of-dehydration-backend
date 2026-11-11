import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Название', example: 'Сухие губы' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Название обязательно' })
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Описание', example: 'Признак обезвоживания' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Описание обязательно' })
  description: string;

  @ApiProperty({ description: 'Коэффициент обезвоживания', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(32767)
  dehydratingCoefficient: number;

  @ApiProperty({ description: 'Максимальный коэффициент', example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(32767)
  maxDehydratingCoefficient: number;
}
