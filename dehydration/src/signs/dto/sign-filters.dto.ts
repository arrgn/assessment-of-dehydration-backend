import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SignFiltersDto {
  @ApiPropertyOptional({ description: 'Поиск по названию', example: 'губы' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Минимальный коэффициент', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min?: number;

  @ApiPropertyOptional({ description: 'Максимальный коэффициент', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max?: number;
}
