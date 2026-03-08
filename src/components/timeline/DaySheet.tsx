'use client';

import type { Day, ScheduleItem, CustomItem } from '@/types';
import MUSEUMS from '@/data/museums.json';
import FOODS from '@/data/foods.json';
import TOURS from '@/data/tours.json';
import SPOTS from '@/data/spots.json';
import TRANSIT_DATA from '@/data/transit.json';
import type { MajorTransit } from '@/types';
import TransitCard from '@/components/content/TransitCard';

interface DaySheetProps {
  day: Day;
  items: ScheduleItem[];
  customItems: CustomItem[];
  onRemove: (index: number) => void;
  onAdd: () => void;
}

function itemDetail(it: ScheduleItem, customItems: CustomItem[]): string {
  // 커스텀 아이템 우선 검색
  const c = customItems.find((x) => x.id === it.id);
  if (c) return [c.price, c.cat].filter(Boolean).join(' · ') || '직접 추가';
  if (it.type === 'museum') { const m = MUSEUMS.find((x) => x.id === it.id); return m ? `${m.price} · ${m.dur}` : ''; }
  if (it.type === 'food') { const f = FOODS.find((x) => x.id === it.id); return f ? `${f.price} · ${f.cat}` : ''; }
  if (it.type === 'tour') { const t = TOURS.find((x) => x.id === it.id); return t ? `${t.price} · ${t.dur}` : ''; }
  if (it.type === 'spot') { const s = SPOTS.find((x) => x.id === it.id); return s ? s.cat : ''; }
  return '';
}

export default function DaySheet({ day, items, customItems, onRemove, onAdd }: DaySheetProps) {
  const transitData = day.transit ? (TRANSIT_DATA as Record<string, MajorTransit>)[day.transit] : null;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        <span className="sm gray">{day.hotel}</span>
        {day.memo && <span className="sm orange">{day.memo}</span>}
      </div>

      {transitData && <TransitCard transit={transitData} />}

      {items.length === 0 ? (
        <div className="empty">아직 추가된 일정이 없습니다</div>
      ) : (
        items.map((it, i) => {
          const det = itemDetail(it, customItems);
          return (
            <div key={i} className="si">
              <div className="si-left">
                <div className={`si-dot ${it.type || 'custom'}`} />
                <div style={{ minWidth: 0 }}>
                  <div className="si-name">{it.name}</div>
                  {det && <div className="si-sub">{det}</div>}
                </div>
              </div>
              <button className="si-rm" onClick={() => onRemove(i)}>✕</button>
            </div>
          );
        })
      )}

      <button className="add-btn" onClick={onAdd}>+ 일정 추가</button>
    </div>
  );
}
