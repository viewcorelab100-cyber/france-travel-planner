'use client';

import { useState } from 'react';
import DAYS from '@/data/days.json';
import type { Day, ScheduleItem } from '@/types';
import { useScheduleStore } from '@/stores/schedule';
import { useToast } from '@/components/ui/Toast';
import BottomSheet from '@/components/layout/BottomSheet';
import DayCard from './DayCard';
import DaySheet from './DaySheet';
import AddSheet from './AddSheet';
import CourseSheet from './CourseSheet';

type SheetMode = 'none' | 'day' | 'add' | 'course';

export default function Timeline() {
  const { sch, custom, addItem, removeItem } = useScheduleStore();
  const toast = useToast((s) => s.show);
  const [sheet, setSheet] = useState<SheetMode>('none');
  const [curDate, setCurDate] = useState<string | null>(null);

  const curDay = DAYS.find((d) => d.date === curDate) as Day | undefined;
  const curItems: ScheduleItem[] = curDate ? sch[curDate] || [] : [];
  const existingIds = new Set(curItems.map((x) => x.id));

  function openDay(date: string) { setCurDate(date); setSheet('day'); }
  function openAdd(date: string) { setCurDate(date); setSheet('add'); }
  function openCourse(date: string) { setCurDate(date); setSheet('course'); }
  function close() { setSheet('none'); }

  function handleAddItem(item: ScheduleItem) {
    if (!curDate) return;
    addItem(curDate, item);
    toast(item.name + ' 추가됨');
  }

  function handleRemove(index: number) {
    if (!curDate) return;
    removeItem(curDate, index);
    toast('삭제했습니다');
  }

  return (
    <>
      <div className="timeline">
        {(DAYS as Day[]).map((d) => (
          <DayCard
            key={d.date}
            day={d}
            items={sch[d.date] || []}
            onClickDay={() => openDay(d.date)}
            onClickAdd={() => openAdd(d.date)}
            onClickCourse={() => openCourse(d.date)}
          />
        ))}
      </div>

      <BottomSheet open={sheet === 'day'} onClose={close}
        title={curDay ? `${curDay.date} (${curDay.day}) ${curDay.city}` : ''}>
        {curDay && <DaySheet day={curDay} items={curItems} customItems={custom} onRemove={handleRemove} onAdd={() => setSheet('add')} />}
      </BottomSheet>

      <BottomSheet open={sheet === 'add'} onClose={() => curDate ? setSheet('day') : close()}
        title="일정에 추가">
        {curDay && <AddSheet day={curDay} existingIds={existingIds} customItems={custom} onAdd={handleAddItem} />}
      </BottomSheet>

      <BottomSheet open={sheet === 'course'} onClose={close}
        title={curDay ? `${curDay.date} (${curDay.day}) 추천 코스` : ''}>
        {curDay && <CourseSheet day={curDay} items={curItems} customItems={custom} />}
      </BottomSheet>
    </>
  );
}
