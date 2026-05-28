import { Body, Controller, Delete, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import type { CreateUserInput } from '../user/user.service.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../jwtAuth.guard.js';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService
    ) { }

    @Post('register')
    async register(@Body() body: CreateUserInput) {
        return this.userService.create(body);
    }

    @Post('login')
    async login(@Body() body: { username: string, password: string }) {
        const user = await this.authService.validateUser(body.username, body.password);
        return this.authService.login(user);
    }

    @Post('refresh')
    async refresh(@Body() body: { refreshToken: string }) {
        return this.authService.refreshToken(body.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@Body() body: { refreshToken: string }) {
        return this.authService.logout(body.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete')
    async deleteAccount(@Request() req) {
        await this.userService.delete(req.user.user_id);
        return { message: 'Account deleted successfully' };
    }

}