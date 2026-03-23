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

  // 시간 지정된 아이템 / 미지정 아이템 분리
  const timed: ScheduleItem[] = [];
  const foods: ScheduleItem[] = [];
  const others: ScheduleItem[] = [];
  items.forEach((it) => {
    if (it.userTime) timed.push(it);
    else if (it.type === 'food') foods.push(it);
    else others.push(it);
  });

  // 시간 지정 아이템을 시간순 정렬
  timed.sort((a, b) => {
    const [ah, am] = (a.userTime || '0:0').split(':').map(Number);
    const [bh, bm] = (b.userTime || '0:0').split(':').map(Number);
    return (ah * 60 + am) - (bh * 60 + bm);
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

  // === 시간 지정 아이템을 고정 슬롯으로 변환 ===
  interface FixedSlot { time: number; item: ScheduleItem; isFood: boolean }
  const fixedSlots: FixedSlot[] = timed.map((it) => {
    const [h, m] = (it.userTime || '9:00').split(':').map(Number);
    return { time: h * 60 + m, item: it, isFood: it.type === 'food' };
  });

  // === 모든 이벤트(고정 + 자동)를 시간순으로 빌드 ===
  const schedule: ScheduleNode[] = [];
  let t = 9 * 60; // 09:00
  let prevZone = hotelZone;
  let prevGmap = hotelGmap;
  let mealIdx = 0;
  let fixedIdx = 0;

  // 호텔 출발
  schedule.push({ type: 'hotel', time: t, name: day.hotel, gmap: hotelGmap });

  // 고정 슬롯과 자동 아이템을 시간순으로 인터리브
  for (let i = 0; i < sorted.length; i++) {
    const it = sorted[i];
    const src = findItem(it.id, it.type, customItems);
    const zone = getZone(it, customItems);
    const gm = getGmap(it, customItems);
    const dur = src && 'dur' in src ? parseDur(src.dur) : 45;

    // 이 아이템 전에 고정 슬롯을 넣어야 하는지 체크
    while (fixedIdx < fixedSlots.length) {
      const fs = fixedSlots[fixedIdx];
      if (t >= fs.time - 30 || t + zoneTravelMin(prevZone, zone) + dur > fs.time) {
        const fsSrc = findItem(fs.item.id, fs.item.type, customItems);
        const fsGmap = getGmap(fs.item, customItems);
        const fsZone = getZone(fs.item, customItems);
        const fsTravel = zoneTravelMin(prevZone, fsZone);

        if (t < fs.time - fsTravel) t = fs.time - fsTravel;
        schedule.push({ type: 'travel', min: fsTravel, from: prevGmap, to: fsGmap });
        t = fs.time; // 고정 시간 사용

        if (fs.isFood) {
          schedule.push({ type: 'meal', time: t, item: fs.item, dur: 60, label: fs.item.reserved ? '예약' : '식사' });
          t += 60;
        } else {
          const fsDur = fsSrc && 'dur' in fsSrc ? parseDur(fsSrc.dur) : 45;
          schedule.push({ type: 'place', time: t, item: fs.item, src: fsSrc, dur: fsDur });
          t += fsDur;
        }
        prevGmap = fsGmap;
        prevZone = fsZone;
        fixedIdx++;
      } else {
        break;
      }
    }

    // 이 아이템 전에 식사를 넣어야 하는지 체크
    while (mealIdx < mealSlots.length) {
      const meal = mealSlots[mealIdx];
      const travelToNext = zoneTravelMin(prevZone, zone);
      const itemEndTime = t + travelToNext + dur;
      if (t >= meal.targetTime - 30 || itemEndTime > meal.targetTime + 60) {
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
        break;
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

  // 남은 고정 슬롯 처리
  while (fixedIdx < fixedSlots.length) {
    const fs = fixedSlots[fixedIdx];
    const fsSrc = findItem(fs.item.id, fs.item.type, customItems);
    const fsGmap = getGmap(fs.item, customItems);
    const fsZone = getZone(fs.item, customItems);
    const fsTravel = zoneTravelMin(prevZone, fsZone);

    if (t < fs.time - fsTravel) t = fs.time - fsTravel;
    schedule.push({ type: 'travel', min: fsTravel, from: prevGmap, to: fsGmap });
    t = fs.time;

    if (fs.isFood) {
      schedule.push({ type: 'meal', time: t, item: fs.item, dur: 60, label: fs.item.reserved ? '예약' : '식사' });
      t += 60;
    } else {
      const fsDur = fsSrc && 'dur' in fsSrc ? parseDur(fsSrc.dur) : 45;
      schedule.push({ type: 'place', time: t, item: fs.item, src: fsSrc, dur: fsDur });
      t += fsDur;
    }
    prevGmap = fsGmap;
    prevZone = fsZone;
    fixedIdx++;
  }

  // 남은 식사 처리
  while (mealIdx < mealSlots.length) {
    const meal = mealSlots[mealIdx];
    const mealGmap = getGmap(meal.item, customItems);
    const mealZone = getZone(meal.item, customItems);
    const mealTravel = zoneTravelMin(prevZone, mealZone);

    if (t < meal.targetTime - 30) t = meal.targetTime;

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
