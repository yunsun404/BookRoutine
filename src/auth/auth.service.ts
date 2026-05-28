import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserService } from '../user/user.service.js';
import { PrismaService } from '../prisma/prisma.service.js';


// 1. 임시 배열로 로그인 → JWT 발급
// 2. 토큰 검증 (Guard 구현)
// 3. 토큰 갱신
// 4. 흐름 이해되면 그때 DB 연결로 교체

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private prisma: PrismaService
    ) { }

    refreshTokenStore: { userId: string; token: string }[] = []; // 간단한 토큰 저장소 (실제 프로젝트에서는 DB 사용 권장)

    async validateUser(username: string, password: string): Promise<User> {
        const user = await this.userService.validateUser(username, password);
        if (!user) throw new UnauthorizedException('Invalid credentials');
        return user;
    }

    async login(user: User) {
        const payload_acc = { username: user.username, sub: user.user_id };
        const payload_ref = { sub: user.user_id, type: 'refresh' };

        // access token과 refresh token을 변수에 담음
        const accessToken = this.jwtService.sign(payload_acc);
        const refreshToken = this.jwtService.sign(payload_ref, { expiresIn: '7d' });

        this.refreshTokenStore.push({ userId: user.user_id, token: refreshToken }); // 발급된 refresh token을 위 배열에 저장
        await this.prisma.refreshToken.create({
            data: {
                user_id: user.user_id,
                refresh_token: refreshToken,
                created_at: new Date()
            }
        }); // 발급된 refresh token을 RefreshToken 테이블에 저장

        return { // 로그인 시 access token과 refresh token을 함께 발급
            access_token: accessToken,
            refresh_token: refreshToken
        };
    }

    async refreshToken(refreshToken: string) {
        // console.log('user_id : ', user_id);
        // console.log('refreshToken 진입');
        try {
            // console.log('try 진입');
            // const token = await this.prisma.refreshToken.findFirst({
            //     where: { user_id: user_id }
            // });
            // console.log('const token : ', token);
            const storedToken = await this.prisma.refreshToken.findFirst({
                where: { refresh_token: refreshToken }
            });
            // if (token) {
            //     const payload = this.jwtService.verify(token.refresh_token);
            //     // const storedToken = this.refreshTokenStore.find(rt => rt.token === refreshToken);
            // } else throw new NotFoundException('Token Not Found');
            if (storedToken) {
                const payload = this.jwtService.verify(refreshToken);
                const accessToken = this.jwtService.sign({ sub: payload.sub });
                return { access_token: accessToken };
            }
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    logout(refreshToken: string) {
        // 간단한 로그아웃 구현: refresh token을 저장소에서 제거
        this.refreshTokenStore = this.refreshTokenStore.filter(rt => rt.token !== refreshToken);
        // const deleteToken=this.prisma.refreshToken.findFirst({
        //     where:{refresh_token:refreshToken}
        // });
        // this.prisma.refreshToken.delete({deleteToken});
        return { message: 'Logged out successfully' };
    }
}