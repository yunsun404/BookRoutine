import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Supabase가 발급한 JWT를 Authorization 헤더에서 추출
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Supabase 프로젝트 Settings → API → JWT Secret
      secretOrKey: process.env.SUPABASE_JWT_SECRET!
    });
  }

  async validate(payload: any) {
    if (!payload.sub) throw new UnauthorizedException();
    // req.user에 들어갈 값
    return { sub: payload.sub, email: payload.email };
  }
}