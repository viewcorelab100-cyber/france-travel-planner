import type { ContentType } from '@/types';

export const TYPE_EMOJI: Record<ContentType, string> = {
  museum: '🎨',
  food: '🍽️',
  tour: '🚶',
  spot: '📍',
  custom: '📌',
};

export const FOOD_SUBS = ['전체', '미슐랭', '부이용', '비스트로', '캐주얼', '아침', '먹음', '패스'] as const;

export const SPOT_SUBS_NICE = ['전체', '산책', '거리', '마켓', '전망', '광장', '근교'] as const;
export const SPOT_SUBS_PARIS = ['전체', '랜드마크', '거리', '건축', '공원', '전망', '쇼핑', '산책', '근교'] as const;

export const FOOD_STATUS_CYCLE = ['none', 'eaten', 'pass'] as const;
export const FOOD_STATUS_LABEL: Record<string, string> = {
  none: '☐ 후보',
  eaten: '✅ 먹음',
  pass: '❌ 패스',
};

export const CAT_LABELS: Record<string, string> = {
  museum: '미술관',
  food: '맛집',
  tour: '투어',
  spot: '관광지',
};
