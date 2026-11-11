import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterUserDto {
  @ApiProperty({ description: 'Имя', example: 'Иван' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Имя обязательно' })
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Логин (латиница, цифры, _ . -)',
    example: 'ivan',
  })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_.-]+$/, {
    message: 'Логин может содержать латиницу, цифры и символы _ . -',
  })
  login: string;

  @ApiProperty({ description: 'Пароль, от 6 символов', example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не короче 6 символов' })
  @MaxLength(128)
  password: string;
}
