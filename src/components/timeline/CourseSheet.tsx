'use client';

import type { Day, ScheduleItem, CustomItem } from '@/types';
import { buildCourseSchedule } from '@/utils/schedule';
import { findItem, fmtTime } from '@/utils/course';
import { gmapDir } from '@/utils/maps';
import { TYPE_EMOJI } from '@/data/constants';

interface CourseSheetProps {
  day: Day;
  items: ScheduleItem[];
  customItems: CustomItem[];
}

export default function CourseSheet({ day, items, customItems }: CourseSheetProps) {
  if (!items.length) return <div className="empty">일정이 없습니다</div>;

  const { schedule, endTime } = buildCourseSchedule(day, items, customItems);

  const totalHr = Math.round(((endTime - 9 * 60) / 60) * 10) / 10;
  let totalPrice = 0;
  items.forEach((it) => {
    const src = findItem(it.id, it.type, customItems);
    if (src && 'price' in src && !('free' in src && src.free)) {
      const m = String(src.price).match(/(\d+\.?\d*)/);
      if (m) totalPrice += parseFloat(m[1]);
    }
  });

  return (
    <div>
      {schedule.map((s, i) => {
        if (s.type === 'hotel') {
          return (
            <div key={i} className="course-item">
              <div className="course-line">
                <div className="course-dot hotel" />
                <div className="course-connector" />
              </div>
              <div className="course-info">
                <div className="course-name"><b>{fmtTime(s.time)}</b>&nbsp; 🏨 {s.name}</div>
              </div>
            </div>
          );
        }
        if (s.type === 'travel') {
          const mode = s.min <= 8 ? '🚶 도보' : s.min <= 20 ? '🚶 도보 또는 🚌 버스/메트로' : '🚌 메트로/버스';
          return (
            <a key={i} className="course-dir" href={gmapDir(s.from, s.to)} target="_blank" rel="noopener noreferrer">
              {mode} ~{s.min}분 · 📍 구글맵으로 길찾기 →
            </a>
          );
        }
        if (s.type === 'place') {
          const emoji = TYPE_EMOJI[s.item.type] || '📌';
          let meta = '약 ' + Math.round(s.dur / 15) * 15 + '분';
          if (s.src && 'price' in s.src) meta = s.src.price + ' · ' + meta;
          return (
            <div key={i} className="course-item">
              <div className="course-line">
                <div className={`course-dot ${s.item.type || 'custom'}`} />
                <div className="course-connector" />
              </div>
              <div className="course-info">
                <div className="course-name"><b>{fmtTime(s.time)}</b>&nbsp; {emoji} {s.item.name}</div>
                <div className="course-meta">{meta}</div>
              </div>
            </div>
          );
        }
        if (s.type === 'meal') {
          const src = findItem(s.item.id, s.item.type, customItems);
          let meta = '약 1시간';
          if (src && 'price' in src) meta = src.price + ' · ' + meta;
          return (
            <div key={i} className="course-item">
              <div className="course-line">
                <div className="course-dot food" />
                <div className="course-connector" />
              </div>
              <div className="course-info">
                <div className="course-name">
                  <b>{fmtTime(s.time)}</b>&nbsp; 🍽️ {s.item.name} <span className="sm orange">{s.label}</span>
                </div>
                <div className="course-meta">{meta}</div>
              </div>
            </div>
          );
        }
        return null;
      })}

      <div className="course-summary">
        <b>⏱️ 예상 소요</b> 약 {totalHr}시간 ({fmtTime(9 * 60)} ~ {fmtTime(endTime)})<br />
        {totalPrice > 0 && <><b>💰 예상 비용</b> ~{totalPrice}€<br /></>}
        <br />
        <b>💡 팁</b><br />
        • 각 &quot;구글맵으로 길찾기&quot;를 탭 → 실시간 경로 확인<br />
        • 이동시간은 추정치입니다. 실제는 구글맵에서 확인하세요<br />
        • 맛집은 점심/저녁 시간대에 자동 배치됩니다
      </div>
    </div>
  );
}
