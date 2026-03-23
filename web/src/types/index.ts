// ===== 도시/카테고리 =====
export type City = 'nice' | 'paris';
export type CityKey = City | 'travel';
export type ContentType = 'museum' | 'food' | 'tour' | 'spot' | 'custom';

// ===== 날짜 =====
export interface Day {
  date: string;
  day: string;
  city: string;
  ck: CityKey;
  memo: string;
  hotel: string;
  hgmap: string;
  hz: string;
  transit?: string;
}

// ===== 미술관 =====
export interface Museum {
  id: string;
  name: string;
  desc: string;
  price: string;
  dur: string;
  closed: string;
  city: City;
  free: boolean;
  gmap: string;
  zone: string;
}

// ===== 맛집 =====
export interface Food {
  id: string;
  name: string;
  desc: string;
  price: string;
  rsv: string;
  city: City;
  cat: string;
  note?: string;
  gmap: string;
  zone: string;
}

// ===== 투어 =====
export interface Tour {
  id: string;
  name: string;
  price: string;
  dur: string;
  city: City;
  note?: string;
  link?: string;
  zone: string;
  gmap: string;
}

// ===== 관광지 =====
export interface Spot {
  id: string;
  name: string;
  desc: string;
  city: City;
  cat: string;
  gmap: string;
  zone: string;
}

// ===== 커스텀 장소 =====
export interface CustomItem {
  id: string;
  name: string;
  desc: string;
  price: string;
  type: ContentType;
  city: City;
  zone: string;
  cat: string;
  rsv: string;
  gmap: string;
  link?: string;
}

// ===== 일정 항목 =====
export interface ScheduleItem {
  id: string;
  type: ContentType;
  name: string;
  gmap?: string;
  zone?: string;
  userTime?: string;   // 사용자 지정 시간 "HH:MM"
  reserved?: boolean;  // 예약 완료 여부
}

// ===== 대규모 이동 =====
export interface TransitOption {
  icon: string;
  name: string;
  price: string;
  dur: string;
  desc: string;
}

export interface MajorTransit {
  label: string;
  options: TransitOption[];
  bookLink: string;
}

// ===== 준비물 =====
export interface SupplyItem {
  t: string;
  m: string;
}

// ===== 코스 스케줄 =====
export type ScheduleNode =
  | { type: 'hotel'; time: number; name: string; gmap: string }
  | { type: 'travel'; min: number; from: string; to: string }
  | { type: 'place'; time: number; item: ScheduleItem; src: Museum | Tour | Spot | CustomItem | null; dur: number }
  | { type: 'meal'; time: number; item: ScheduleItem; dur: number; label: string };

// ===== 상태 =====
export interface FoodStatus {
  [foodId: string]: 'none' | 'eaten' | 'pass';
}

export interface CheckStatus {
  [key: string]: boolean;
}
