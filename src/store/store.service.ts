import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

export interface StoreItem {
    character_id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
}
export interface PurchaseResult {
    character_id: string;
    name: string;
    purchased_at: Date;
    remaining_points: number;
}

@Injectable()
export class StoreService {
    constructor(private readonly prisma: PrismaService) { }

    async getStoreList(): Promise<StoreItem[]> {
        const items = await this.prisma.character.findMany({
            orderBy: { price: 'asc' },
            select: {
                character_id: true,
                name: true,
                description: true,
                price: true,
                image_url: true,
            },
        });

        return items;
    }

    async getStoreItem(character_id: string): Promise<StoreItem> {
        const item = await this.prisma.character.findUnique({
            where: { character_id },
            select: {
                character_id: true,
                name: true,
                description: true,
                price: true,
                image_url: true,
            },
        });

        if (!item) {
            throw new NotFoundException('존재하지 않는 상품입니다.');
        }

        return item;
    }

    async purchaseItem(user_id: string, character_id: string): Promise<PurchaseResult> {
        // 1. 상품 존재 확인
        const character = await this.prisma.character.findUnique({
            where: { character_id },
        });

        if (!character) {
            throw new NotFoundException('존재하지 않는 상품입니다.');
        }

        // 2. 이미 보유 중인지 확인
        const alreadyOwned = await this.prisma.userCharacter.findUnique({
            where: {
                user_id_character_id: { user_id, character_id },
            },
        });

        if (alreadyOwned) {
            throw new ConflictException('이미 보유한 캐릭터입니다.');
        }

        // 3. 포인트 확인
        const user = await this.prisma.user.findUnique({
            where: { user_id },
            select: { points: true },
        });

        if (!user) {
            throw new NotFoundException('존재하지 않는 사용자입니다.');
        }

        if (user.points < character.price) {
            throw new BadRequestException('포인트가 부족합니다.');
        }

        // 4. 트랜잭션: 포인트 차감 + 소유권 등록 + 포인트 로그 기록
        const [updatedUser, userCharacter] = await this.prisma.$transaction([
            this.prisma.user.update({
                where: { user_id },
                data: { points: { decrement: character.price } },
                select: { points: true },
            }),
            this.prisma.userCharacter.create({
                data: { user_id, character_id },
            }),
            this.prisma.pointLog.create({
                data: {
                    point_log_id: randomUUID(),
                    user_id,
                    amount: -character.price,
                    reason: 'CHARACTER_PURCHASE',
                },
            }),
        ]);

        return {
            character_id: userCharacter.character_id,
            name: character.name,
            purchased_at: userCharacter.purchased_at,
            remaining_points: updatedUser.points,
        };
    }
}