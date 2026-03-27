'use client';

import { useState, useRef, useEffect } from 'react';
import type { Day, ScheduleItem, CustomItem } from '@/types';
import { useMemoStore } from '@/stores/memo';
import { gmap } from '@/utils/maps';
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

function itemLink(it: ScheduleItem, customItems: CustomItem[]): string {
  const c = customItems.find((x) => x.id === it.id);
  if (c) return c.link || gmap(c.gmap || c.name);
  if (it.type === 'museum') { const m = MUSEUMS.find((x) => x.id === it.id); return gmap(m?.gmap || it.name); }
  if (it.type === 'food') { const f = FOODS.find((x) => x.id === it.id); return gmap(f?.gmap || it.name); }
  if (it.type === 'tour') { const t = TOURS.find((x) => x.id === it.id); return t?.link || gmap(t?.gmap || it.name); }
  if (it.type === 'spot') { const s = SPOTS.find((x) => x.id === it.id); return gmap(s?.gmap || it.name); }
  return gmap(it.name);
}

function sortedByTime(items: ScheduleItem[]): { item: ScheduleItem; origIdx: number }[] {
  return items
    .map((item, origIdx) => ({ item, origIdx }))
    .sort((a, b) => {
      if (!a.item.userTime && !b.item.userTime) return 0;
      if (!a.item.userTime) return 1;
      if (!b.item.userTime) return -1;
      return a.item.userTime.localeCompare(b.item.userTime);
    });
}

function itemDetail(it: ScheduleItem, customItems: CustomItem[]): string {
  const c = customItems.find((x) => x.id === it.id);
  if (c) return [c.price, c.cat].filter(Boolean).join(' · ') || '직접 추가';
  if (it.type === 'museum') { const m = MUSEUMS.find((x) => x.id === it.id); return m ? `${m.price} · ${m.dur}` : ''; }
  if (it.type === 'food') { const f = FOODS.find((x) => x.id === it.id); return f ? `${f.price} · ${f.cat}` : ''; }
  if (it.type === 'tour') { const t = TOURS.find((x) => x.id === it.id); return t ? `${t.price} · ${t.dur}` : ''; }
  if (it.type === 'spot') { const s = SPOTS.find((x) => x.id === it.id); return s ? s.cat : ''; }
  return '';
}

function MemoSection({ date }: { date: string }) {
  const memo = useMemoStore((s) => s.memos[date] || '');
  const setMemo = useMemoStore((s) => s.setMemo);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(memo); }, [memo]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  function handleSave() {
    setMemo(date, draft.trim());
    setEditing(false);
  }

  if (!editing && !memo) {
    return (
      <button className="memo-add-btn" onClick={() => setEditing(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        메모 추가
      </button>
    );
  }

  if (editing) {
    return (
      <div className="memo-edit">
        <textarea
          ref={textareaRef}
          className="memo-textarea"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          placeholder="확인할 사항, 메모, 감상 등 자유롭게 작성..."
          rows={3}
        />
        <div className="memo-actions">
          <button className="memo-cancel" onClick={() => { setDraft(memo); setEditing(false); }}>취소</button>
          <button className="memo-save" onClick={handleSave}>저장</button>
        </div>
      </div>
    );
  }

  return (
    <div className="memo-view" onClick={() => setEditing(true)}>
      <div className="memo-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        메모
      </div>
      <div className="memo-content">{memo}</div>
    </div>
  );
}

export default function DaySheet({ day, items, customItems, onRemove, onAdd }: DaySheetProps) {
  const transitData = day.transit ? (TRANSIT_DATA as Record<string, MajorTransit>)[day.transit] : null;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        <button className="sm-hotel-btn" onClick={() => window.open(gmap(day.hgmap), '_blank')}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {day.hotel}
        </button>
        {day.memo && <span className="sm orange">{day.memo}</span>}
      </div>

      <MemoSection date={day.date} />

      {transitData && <TransitCard transit={transitData} />}

      {items.length === 0 ? (
        <div className="empty">아직 추가된 일정이 없습니다</div>
      ) : (
        sortedByTime(items).map(({ item: it, origIdx }) => {
          const det = itemDetail(it, customItems);
          const link = itemLink(it, customItems);
          return (
            <div key={origIdx} className="si si-link" onClick={() => window.open(link, '_blank')} style={{ cursor: 'pointer' }}>
              <div className="si-left">
                <div className={`si-dot ${it.type || 'custom'}`} />
                <div style={{ minWidth: 0 }}>
                  <div className="si-name">
                    {it.userTime && <span className="sm blue" style={{ marginRight: 4 }}>{it.userTime}</span>}
                    {it.name}
                    {it.reserved && <span className="sm pink" style={{ marginLeft: 4 }}>예약</span>}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, opacity: 0.4, flexShrink: 0 }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </div>
                  {det && <div className="si-sub">{det}</div>}
                </div>
              </div>
              <button className="si-rm" onClick={(e) => { e.stopPropagation(); onRemove(origIdx); }}>✕</button>
            </div>
          );
        })
      )}

      <button className="add-btn" onClick={onAdd}>+ 일정 추가</button>
    </div>
  );
}
