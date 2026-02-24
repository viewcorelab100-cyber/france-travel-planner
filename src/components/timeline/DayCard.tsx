'use client';

import type { Day, ScheduleItem } from '@/types';

interface DayCardProps {
  day: Day;
  items: ScheduleItem[];
  onClickDay: () => void;
  onClickAdd: () => void;
  onClickCourse: () => void;
}

export default function DayCard({ day, items, onClickDay, onClickAdd, onClickCourse }: DayCardProps) {
  const hasItems = items.length > 0;

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
          📋 코스 보기
        </button>
      </div>
    </div>
  );
}
