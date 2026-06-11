import { Body, Controller, Get, NotFoundException, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../jwtAuth.guard';
import { UserService } from './user.service';

// 프로필 수정 인터페이스->클래스
export class UpdateProfileBody {
    nickname?: string;
    age?: number;
    email?: string;
    password?: string;
    profile_image?: string;
    reading_style?: object;
    favorite_genre?: object;
}

@Controller('users')
export class UserController {
    constructor(
        private userService: UserService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    async updateProfile(@Request() req, @Body() body: UpdateProfileBody) {
        const userId = req.user.user_id;
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
