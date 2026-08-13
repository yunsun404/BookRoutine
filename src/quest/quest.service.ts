import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // 경로는 실제 프로젝트 구조에 맞게 조정
import { QuestMeItem } from './quest-me.interface';
import { QuestCompleteData } from './quest-complete.interface'
import { randomUUID } from 'crypto';

@Injectable()
export class QuestService {
    constructor(private readonly prisma: PrismaService) { }

    async getMyQuests(user_id: string): Promise<QuestMeItem[]> {
        // 1. 전체 퀘스트 마스터 조회
        const quests = await this.prisma.quest.findMany({
            orderBy: { created_at: 'asc' },
        });

        // 2. 이 유저의 진행 기록 조회
        const userQuests = await this.prisma.userQuest.findMany({
            where: { user_id: user_id },
        });

        // 3. quest_id -> userQuest 빠르게 찾기 위한 맵
        const userQuestMap = new Map(
            userQuests.map((uq) => [uq.quest_id, uq]),
        );

        // 4. merge: 기록 없으면 기본값(0, false, null)
        return quests.map((quest) => {
            const progress = userQuestMap.get(quest.quest_id);

            return {
                quest_id: quest.quest_id,
                title: quest.title,
                description: quest.description,
                quest_type: quest.quest_type,
                condition_type: quest.condition_type,
                goal_count: quest.goal_count,
                reward_exp: quest.reward_exp,
                reward_points: quest.reward_points,

                current_count: progress?.current_count ?? 0,
                is_completed: progress?.is_completed ?? false,
                completed_at: progress?.completed_at ?? null,
            };
        });
    }

    async completeQuest(userId: string, questId: string): Promise<QuestCompleteData> {
        const quest = await this.prisma.quest.findFirst({
            where: { quest_id: questId },
        });

        if (!quest) {
            throw new NotFoundException('존재하지 않는 퀘스트입니다.');
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. 기존 진행 기록 확인
            const existing = await tx.userQuest.findFirst({
                where: { user_id: userId, quest_id: questId },
            });

            if (existing?.is_completed) {
                throw new ConflictException('이미 완료한 퀘스트입니다.');
            }

            const now = new Date();

            // 2. UserQuest 완료 처리 (있으면 update, 없으면 create)
            if (existing) {
                await tx.userQuest.update({
                    where: { user_quest_id: existing.user_quest_id },
                    data: {
                        current_count: quest.goal_count,
                        is_completed: true,
                        completed_at: now,
                    },
                });
            } else {
                await tx.userQuest.create({
                    data: {
                        user_quest_id: randomUUID(),
                        user_id: userId,
                        quest_id: questId,
                        current_count: quest.goal_count,
                        is_completed: true,
                        completed_at: now,
                        reset_date: now, // 리셋 로직 미구현 상태라 일단 오늘 날짜로 (아래 참고 참고)
                    },
                });
            }

            // 3. 보상 지급 (exp, points)
            const updatedUser = await tx.user.update({
                where: { user_id: userId },
                data: {
                    exp: { increment: quest.reward_exp },
                    points: { increment: quest.reward_points },
                },
            });

            // 4. 로그 기록 (선택이지만 있으면 나중에 히스토리 추적에 좋음)
            await tx.expLog.create({
                data: {
                    exp_log_id: randomUUID(),
                    user_id: userId,
                    amount: quest.reward_exp,
                    reason: `퀘스트 완료: ${quest.title}`,
                },
            });
            await tx.pointLog.create({
                data: {
                    point_log_id: randomUUID(),
                    user_id: userId,
                    amount: quest.reward_points,
                    reason: `퀘스트 완료: ${quest.title}`,
                },
            });

            // 5. 레벨업 계산
            const thresholds = await tx.levelThreshold.findMany({
                orderBy: { level: 'asc' },
            });

            let newLevel = updatedUser.level;
            for (const t of thresholds) {
                if (updatedUser.exp >= t.required_exp) {
                    newLevel = t.level;
                }
            }

            const isLevelUp = newLevel > updatedUser.level;

            if (isLevelUp) {
                await tx.user.update({
                    where: { user_id: userId },
                    data: { level: newLevel },
                });
            }

            return {
                rewardExp: quest.reward_exp,
                currentExp: updatedUser.exp,
                currentLevel: newLevel,
                isLevelUp,
            };
        });
    }
}