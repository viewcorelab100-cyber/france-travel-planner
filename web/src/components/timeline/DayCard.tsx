'use client';

import type { Day, ScheduleItem } from '@/types';
import { useMemoStore } from '@/stores/memo';

interface DayCardProps {
  day: Day;
  items: ScheduleItem[];
  onClickDay: () => void;
  onClickAdd: () => void;
  onClickCourse: () => void;
}

export default function DayCard({ day, items, onClickDay, onClickAdd, onClickCourse }: DayCardProps) {
  const hasItems = items.length > 0;
  const userMemo = useMemoStore((s) => s.memos[day.date] || '');

  return (
    <div className="day-item">
      <div className="day-top-area" onClick={onClickDay}>
        <div className="day-top">
          <span className="day-date">{day.date} {day.day}</span>
          <span className={`city-badge ${day.ck}`}>{day.city}</span>
        </div>
        <div className="day-meta">
          <span className="day-hotel">{day.hotel}</span>
          {day.memo && <span className="day-memo">{day.memo}</span>}
        </div>
        {userMemo && (
          <div className="day-user-memo">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>{userMemo.length > 30 ? userMemo.slice(0, 30) + '...' : userMemo}</span>
          </div>
        )}
        {hasItems ? (
          <div className="day-pills">
            {items.map((it, i) => (
              <span key={i} className={`pill ${it.type || 'spot'}`}>{it.name}</span>
            ))}
          </div>
        ) : (
          <div className="day-empty">아래 버튼으로 일정을 추가하세요</div>
        )}
      </div>
      <div className="day-actions">
        <button
          className="day-action-btn add"
          onClick={(e) => { e.stopPropagation(); onClickAdd(); }}
        >
          + 일정 추가
        </button>
        <button
          className="day-action-btn course"
          disabled={!hasItems}
          onClick={(e) => { e.stopPropagation(); if (hasItems) onClickCourse(); }}
        >
          코스 보기
        </button>
      </div>
    </div>
  );
}
