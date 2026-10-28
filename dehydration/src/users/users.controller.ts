import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponse, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() dto: RegisterUserDto): Promise<UserResponse> {
    return this.usersService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() _dto: LoginUserDto) {
    return { message: 'Аутентификация будет реализована в лабораторной 4' };
  }

  @Post('logout')
  @HttpCode(200)
  logout() {
    return { message: 'Деавторизация будет реализована в лабораторной 4' };
  }
}
