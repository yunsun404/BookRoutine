import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileBody } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.sub);
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(@Request() req, @Body() body: UpdateProfileBody) {
    const userId = req.user.sub;
    const updatedUser = await this.userService.update(userId, body);
    const { password, ...result } = updatedUser;
    return { message: 'Profile updated successfully', user: result };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':user_id')
  async getUsersProfile(@Param('user_id') user_id: string) {
    const user = await this.userService.findById(user_id);
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return { user: result };
  }
}
