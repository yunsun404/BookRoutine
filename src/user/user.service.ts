import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileBody } from './user.controller';
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

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async create(user: CreateUserInput): Promise<Omit<User, 'password'>> {
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
        const { password, ...result } = createdUser;
        return result;
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
        return this.prisma.user.update({
            where: { user_id: user_id },
            data: {
                nickname: body.nickname,
                age: body.age,
                email: body.email,
                password: body.password,
                profile_image: body.profile_image,
                reading_style: body.reading_style ?? undefined,
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