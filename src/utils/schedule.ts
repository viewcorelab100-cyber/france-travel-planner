import type { Day, ScheduleItem, ScheduleNode, CustomItem } from '@/types';
import { findItem, getZone, getGmap, sortByZone, parseDur, zoneTravelMin } from './course';

/**
 * 스마트 코스 스케줄링 v2
 *
 * 핵심 원칙:
 * 1. 식사는 시간대에 분배 (점심 ~12:00, 저녁 ~18:00~19:00)
 * 2. 관광 아이템은 식사 사이에 배치 (동선 최적화)
 * 3. 식당이 연속으로 나오지 않도록 non-food를 사이에 배치
 */
export function buildCourseSchedule(
  day: Day,
  items: ScheduleItem[],
  customItems: CustomItem[]
): { schedule: ScheduleNode[]; endTime: number } {
  const city = day.ck === 'travel' ? 'paris' : day.ck === 'nice' ? 'nice' : 'paris';
  const hotelGmap = day.hgmap || day.hotel;
  const hotelZone = day.hz || null;

  // food / non-food 분리
  const foods: ScheduleItem[] = [];
  const others: ScheduleItem[] = [];
  items.forEach((it) => {
    (it.type === 'food' ? foods : others).push(it);
  });

  // non-food를 zone 순으로 정렬
  const sorted = sortByZone(others, city, customItems);

  // 식사 슬롯 배정: 최대 3끼 (아침/점심/저녁)
  // 아침은 일반적으로 호텔에서 하므로, 점심(12:00)과 저녁(18:00~19:00) 위주
  const mealSlots: { item: ScheduleItem; targetTime: number; label: string }[] = [];
  if (foods.length === 1) {
    // 1개: 점심
    mealSlots.push({ item: foods[0], targetTime: 12 * 60, label: '점심' });
  } else if (foods.length === 2) {
    // 2개: 점심 + 저녁
    mealSlots.push({ item: foods[0], targetTime: 12 * 60, label: '점심' });
    mealSlots.push({ item: foods[1], targetTime: 18.5 * 60, label: '저녁' });
  } else if (foods.length >= 3) {
    // 3개+: 아침/브런치 + 점심 + 저녁
    mealSlots.push({ item: foods[0], targetTime: 10 * 60, label: '브런치' });
    mealSlots.push({ item: foods[1], targetTime: 13 * 60, label: '점심' });
    mealSlots.push({ item: foods[2], targetTime: 18.5 * 60, label: '저녁' });
    // 4개 이상은 저녁 이후 추가
    for (let i = 3; i < foods.length; i++) {
      mealSlots.push({ item: foods[i], targetTime: 20 * 60 + (i - 3) * 60, label: '간식' });
    }
  }

  // 스케줄 빌드: non-food 아이템 처리하면서 적절한 시점에 식사 삽입
  const schedule: ScheduleNode[] = [];
  let t = 9 * 60; // 09:00
  let prevZone = hotelZone;
  let prevGmap = hotelGmap;
  let mealIdx = 0; // 다음 삽입할 식사 인덱스

  // 호텔 출발
  schedule.push({ type: 'hotel', time: t, name: day.hotel, gmap: hotelGmap });

  // non-food 아이템을 순서대로 처리하면서, 적절한 시점에 식사 삽입
  for (let i = 0; i < sorted.length; i++) {
    const it = sorted[i];
    const src = findItem(it.id, it.type, customItems);
    const zone = getZone(it, customItems);
    const gm = getGmap(it, customItems);
    const dur = src && 'dur' in src ? parseDur(src.dur) : 45;

    // 이 아이템 전에 식사를 넣어야 하는지 체크
    // 조건: 현재 시간 + 이동시간이 식사 목표 시간에 근접하거나 넘었을 때
    while (mealIdx < mealSlots.length) {
      const meal = mealSlots[mealIdx];
      const travelToNext = zoneTravelMin(prevZone, zone);
      const timeAfterTravel = t + travelToNext;

      // 식사 목표 시간에 도달했거나, 이 아이템 방문 후 식사 시간을 놓칠 때
      const itemEndTime = timeAfterTravel + dur;
      if (t >= meal.targetTime - 30 || itemEndTime > meal.targetTime + 60) {
        // 식사 삽입
        const mealGmap = getGmap(meal.item, customItems);
        const mealZone = getZone(meal.item, customItems);
        const mealTravel = zoneTravelMin(prevZone, mealZone);

        schedule.push({ type: 'travel', min: mealTravel, from: prevGmap, to: mealGmap });
        t += mealTravel;
        schedule.push({ type: 'meal', time: t, item: meal.item, dur: 60, label: meal.label });
        t += 60;
        prevGmap = mealGmap;
        prevZone = mealZone;
        mealIdx++;
      } else {
        break; // 아직 식사 시간 아님
      }
    }

    // non-food 아이템 배치
    const tv = zoneTravelMin(prevZone, zone);
    schedule.push({ type: 'travel', min: tv, from: prevGmap, to: gm });
    t += tv;
    schedule.push({ type: 'place', time: t, item: it, src, dur });
    t += dur;
    prevGmap = gm;
    prevZone = zone;
  }

  // 남은 식사 처리 (non-food가 적어서 아직 안 넣은 식사들)
  while (mealIdx < mealSlots.length) {
    const meal = mealSlots[mealIdx];
    const mealGmap = getGmap(meal.item, customItems);
    const mealZone = getZone(meal.item, customItems);
    const mealTravel = zoneTravelMin(prevZone, mealZone);

    // 목표 시간까지 여유가 있으면 대기 (자유 시간)
    if (t < meal.targetTime - 30) {
      t = meal.targetTime;
    }

    schedule.push({ type: 'travel', min: mealTravel, from: prevGmap, to: mealGmap });
    t += mealTravel;
    schedule.push({ type: 'meal', time: t, item: meal.item, dur: 60, label: meal.label });
    t += 60;
    prevGmap = mealGmap;
    prevZone = mealZone;
    mealIdx++;
  }

  // 호텔 복귀
  const tvHome = prevZone ? zoneTravelMin(prevZone, hotelZone) : 15;
  schedule.push({ type: 'travel', min: tvHome, from: prevGmap, to: hotelGmap });
  t += tvHome;
  schedule.push({ type: 'hotel', time: t, name: day.hotel, gmap: hotelGmap });

  return { schedule, endTime: t };
}
