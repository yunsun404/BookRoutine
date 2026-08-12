import { Body, Controller, Delete, Get, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import type { CreateUserInput } from '../user/user.service.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private userService: UserService
    ) { }

    @Post('register')
    async register(@Body() body: CreateUserInput) {
        const user = await this.userService.create(body);
        return this.authService.login(user);
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
    async logout(@Body() body: { refreshToken: string }) {
        return this.authService.logout(body.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('delete')
    async deleteAccount(@Request() req) {
        return await this.userService.delete(req.user.sub);
    }

}