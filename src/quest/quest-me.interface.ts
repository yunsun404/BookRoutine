export interface QuestMeItem {
    quest_id: string;
    title: string;
    description: string | null;
    quest_type: string;       // 'DAILY' | 'WEEKLY'
    condition_type: string;
    goal_count: number;
    reward_exp: number;
    reward_points: number;

    // 유저 진행 상황 (기록 없으면 기본값)
    current_count: number;
    is_completed: boolean;
    completed_at: Date | null;
}