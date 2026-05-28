import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service.js';
import { JwtStrategy } from '../jwt.strategy.js';
import { AuthController } from './auth.controller.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        // secret: 'SECRET_KEY',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [AuthService, UserService, JwtStrategy, ConfigService, PrismaService],
  exports: [AuthService, JwtModule],
  controllers: [AuthController]
})
export class AuthModule { }