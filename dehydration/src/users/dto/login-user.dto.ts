import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ description: 'Логин', example: 'ivan' })
  @IsString()
  login: string;

  @ApiProperty({ description: 'Пароль', example: 'secret123' })
  @IsString()
  password: string;
}
