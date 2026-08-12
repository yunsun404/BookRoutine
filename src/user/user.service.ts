import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { JsonValue } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

export interface User {
    user_id: string;
    username: string;
    email: string;
    password: string;
    nickname: string;
    age: number | null;
    profile_image: string | null;
    reading_style: JsonValue | null;
    reading_habit: JsonValue | null;
    favorite_genre: JsonValue | null;
    created_at: Date;
    updated_at: Date;
}

// 회원가입 입력용
export interface CreateUserInput {
    username: string;
    email: string;
    password: string;
    nickname: string;
    age?: number;
    profile_image?: string;
    reading_style?: JsonValue;
    reading_habit?: JsonValue;
    favorite_genre?: JsonValue;
}

// 프로필 수정 인터페이스->클래스
export class UpdateProfileBody {
    @IsString()
    @IsOptional()
    nickname?: string;
    @IsNumber()
    @IsOptional()
    age?: number;
    @IsString()
    @IsOptional()
    email?: string;
    @IsString()
    @IsOptional()
    password?: string;
    @IsString()
    @IsOptional()
    profile_image?: string;
    @IsObject()
    @IsOptional()
    reading_style?: object;
    @IsObject()
    @IsOptional()
    reading_habit?: object;
    @IsObject()
    @IsOptional()
    favorite_genre?: object;
}

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async create(user: CreateUserInput): Promise<User> {
        if (await this.prisma.user.findFirst({ where: { username: user.username } })) throw new ConflictException('이미 사용중인 아이디');
        if (await this.prisma.user.findFirst({ where: { email: user.email } })) throw new ConflictException('이미 사용중인 이메일');

        const hashed = await bcrypt.hash(user.password, 10);
        const createdUser = await this.prisma.user.create({
            data: {
                username: user.username,
                email: user.email,
                password: hashed,
                nickname: user.nickname,
                age: user.age,
                profile_image: user.profile_image,
                reading_style: user.reading_style ?? Prisma.JsonNull,
                reading_habit: user.reading_habit ?? Prisma.JsonNull,
                favorite_genre: user.favorite_genre ?? Prisma.JsonNull
            },
        });
        // const { password, ...result } = createdUser; // auth.service의 login()으로 보내서 비밀번호가 노출되지 않음
        return createdUser;
    }

    async findById(user_id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { user_id },
        });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { username },
        });
    }

    async validateUser(username: string, password: string): Promise<User | null> {
        const user = await this.findByUsername(username);
        if (user && await bcrypt.compare(password, user.password)) {
            // if (user && user.password === password) {
            return user;
        }
        return null;
    }

    async update(user_id: string, body: UpdateProfileBody) {
        const hashed = body.password ? await bcrypt.hash(body.password, 10) : undefined;
        return this.prisma.user.update({
            where: { user_id: user_id },
            data: {
                nickname: body.nickname,
                age: body.age,
                email: body.email,
                password: hashed,
                profile_image: body.profile_image ?? undefined,
                reading_style: body.reading_style ?? undefined,
                reading_habit: body.reading_habit ?? undefined,
                favorite_genre: body.favorite_genre ?? undefined,
            }
        });
    }

    async delete(user_id: string): Promise<User> {
        try {
            await this.prisma.refreshToken.deleteMany({
                where: { user_id: user_id },
            });
            return await this.prisma.user.delete({
                where: { user_id },
            });
        } catch (error: any) {
            throw new NotFoundException('Failed to delete user: ' + error.message);
        }
    }
}