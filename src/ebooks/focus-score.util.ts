// 집중도 점수, 골든타임, 리워드(포인트/경험치) 계산 로직
// 반환 키를 Prisma 필드명(snake_case)과 동일하게 맞춰서 service에서 그대로 spread 가능

interface FocusLogLike {
  bucket_start: Date;
  bucket_end: Date;
  focused_ratio: number;
  face_detected: boolean;
  interruption: boolean;
}

export interface FocusComputationResult {
  avg_focus_score: number; // 0~100
  total_focused_sec: number;
  total_unfocused_sec: number;
  interruption_count: number;
  golden_time_start: Date | null;
  golden_time_end: Date | null;
}

const GOLDEN_TIME_THRESHOLD = 0.75; // 이 이상 focused_ratio면 "집중 구간"으로 간주

export function computeFocusResult(logs: FocusLogLike[]): FocusComputationResult {
  if (logs.length === 0) {
    return {
      avg_focus_score: 0,
      total_focused_sec: 0,
      total_unfocused_sec: 0,
      interruption_count: 0,
      golden_time_start: null,
      golden_time_end: null,
    };
  }

  const sorted = [...logs].sort(
    (a, b) => a.bucket_start.getTime() - b.bucket_start.getTime(),
  );

  let weightedFocusSum = 0;
  let totalDurationSec = 0;
  let totalFocusedSec = 0;
  let totalUnfocusedSec = 0;
  let interruptionCount = 0;

  let bestStreakStart: Date | null = null;
  let bestStreakEnd: Date | null = null;
  let bestStreakDuration = 0;
  let curStreakStart: Date | null = null;
  let curStreakEnd: Date | null = null;
  let curStreakDuration = 0;

  for (const log of sorted) {
    const durationSec = Math.max(
      0,
      (log.bucket_end.getTime() - log.bucket_start.getTime()) / 1000,
    );
    totalDurationSec += durationSec;
    weightedFocusSum += log.focused_ratio * durationSec;

    const isFocusedBucket =
      log.face_detected && log.focused_ratio >= GOLDEN_TIME_THRESHOLD;
    if (isFocusedBucket) {
      totalFocusedSec += durationSec;
    } else {
      totalUnfocusedSec += durationSec;
    }

    if (log.interruption) interruptionCount += 1;

    if (isFocusedBucket) {
      if (curStreakStart === null) curStreakStart = log.bucket_start;
      curStreakEnd = log.bucket_end;
      curStreakDuration += durationSec;
      if (curStreakDuration > bestStreakDuration) {
        bestStreakDuration = curStreakDuration;
        bestStreakStart = curStreakStart;
        bestStreakEnd = curStreakEnd;
      }
    } else {
      curStreakStart = null;
      curStreakEnd = null;
      curStreakDuration = 0;
    }
  }

  const avgFocusScore =
    totalDurationSec > 0
      ? Math.round((weightedFocusSum / totalDurationSec) * 100)
      : 0;

  return {
    avg_focus_score: avgFocusScore,
    total_focused_sec: Math.round(totalFocusedSec),
    total_unfocused_sec: Math.round(totalUnfocusedSec),
    interruption_count: interruptionCount,
    golden_time_start: bestStreakStart,
    golden_time_end: bestStreakEnd,
  };
}

// 리워드 산정 (포인트 + 경험치, ebook_reading_sessions에 캐시값으로 저장됨)
export function computeReward(avgFocusScore: number, totalFocusedSec: number) {
  if (totalFocusedSec < 60) {
    // 1분 미만 독서는 리워드 없음 (어뷰징 방지)
    return { reward_points: 0, reward_exp: 0 };
  }
  if (avgFocusScore >= 80) {
    return { reward_points: 50, reward_exp: 30 };
  }
  if (avgFocusScore >= 50) {
    return { reward_points: 20, reward_exp: 15 };
  }
  return { reward_points: 10, reward_exp: 5 };
}