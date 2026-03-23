'use client';

import { useState } from 'react';
import type { Day, ScheduleItem, ContentType } from '@/types';
import type { Museum, Food, Tour, Spot, CustomItem } from '@/types';
import MUSEUMS from '@/data/museums.json';
import FOODS from '@/data/foods.json';
import TOURS from '@/data/tours.json';
import SPOTS from '@/data/spots.json';

interface AddSheetProps {
  day: Day;
  existingIds: Set<string>;
  customItems: CustomItem[];
  onAdd: (item: ScheduleItem) => void;
}

const CATS: { key: ContentType; label: string }[] = [
  { key: 'museum', label: '미술관' },
  { key: 'food', label: '맛집' },
  { key: 'tour', label: '투어' },
  { key: 'spot', label: '관광지' },
];

interface Pending {
  id: string;
  type: ContentType;
  name: string;
}

export default function AddSheet({ day, existingIds, customItems, onAdd }: AddSheetProps) {
  const [cat, setCat] = useState<ContentType>('museum');
  const [pending, setPending] = useState<Pending | null>(null);
  const [time, setTime] = useState('');
  const [reserved, setReserved] = useState(false);
  const cityPri = day.ck === 'nice' || day.ck === 'paris' ? day.ck : null;

  function order<T extends { city: string }>(arr: T[]) {
    if (!cityPri) return [{ items: arr, label: '전체' }];
    const a = arr.filter((x) => x.city === cityPri);
    const b = arr.filter((x) => x.city !== cityPri);
    const la = cityPri === 'nice' ? '니스' : '파리';
    const lb = cityPri === 'nice' ? '파리' : '니스';
    const r: { items: T[]; label: string }[] = [{ items: a, label: la }];
    if (b.length) r.push({ items: b, label: lb });
    return r;
  }

  function openForm(id: string, type: ContentType, name: string) {
    setPending({ id, type, name });
    setTime('');
    setReserved(false);
  }

  function confirmAdd() {
    if (!pending) return;
    const entry: ScheduleItem = {
      id: pending.id,
      type: pending.type,
      name: pending.name,
    };
    const cust = customItems.find((c) => c.id === pending.id);
    if (cust) {
      entry.gmap = cust.gmap;
      entry.zone = cust.zone;
    }
    if (time) entry.userTime = time;
    if (reserved) entry.reserved = true;
    onAdd(entry);
    setPending(null);
  }

  function Row({ id, type, name, desc, badges, added }: {
    id: string; type: ContentType; name: string; desc?: string;
    badges: string; added: boolean;
  }) {
    const isPending = pending?.id === id;
    return (
      <div className={`add-row${isPending ? ' pending' : ''}`}>
        <div className="ar-left">
          <div className="ar-name">{name}</div>
          {desc && <div className="ar-desc">{desc}</div>}
          <div className="ar-meta" dangerouslySetInnerHTML={{ __html: badges }} />
        </div>
        <button
          className={`ar-btn ${added ? 'done' : ''}`}
          disabled={added}
          onClick={() => openForm(id, type, name)}
        >
          {added ? '✓' : '+'}
        </button>
      </div>
    );
  }

  const b = (color: string, text: string) => `<span class="sm ${color}">${text}</span>`;
  const customForCat = customItems.filter((c) => c.type === cat);

  const customCounts = CATS.reduce((acc, c) => {
    acc[c.key] = customItems.filter((x) => x.type === c.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* 시간/예약 입력 폼 */}
      {pending && (
        <div className="add-form-overlay">
          <div className="add-form">
            <div className="add-form-title">{pending.name}</div>
            <div className="add-form-row">
              <label>시간 (선택)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="예: 12:00"
              />
            </div>
            <div className="add-form-row">
              <label>
                <input
                  type="checkbox"
                  checked={reserved}
                  onChange={(e) => setReserved(e.target.checked)}
                />
                {' '}예약 완료
              </label>
            </div>
            <div className="add-form-actions">
              <button className="add-form-cancel" onClick={() => setPending(null)}>취소</button>
              <button className="add-form-confirm" onClick={confirmAdd}>추가</button>
            </div>
          </div>
        </div>
      )}

      <div className="add-tabs">
        {CATS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`add-tab ${cat === c.key ? 'active' : ''}`}
          >
            {c.label}{customCounts[c.key] > 0 ? ` (${customCounts[c.key]})` : ''}
          </button>
        ))}
      </div>

      {customForCat.length > 0 && (
        <div>
          <div className="add-sec" style={{ color: 'var(--purple, #a855f7)' }}>내가 추가한 항목</div>
          {customForCat.map((c) => (
            <Row key={c.id} id={c.id} type={c.type as ContentType} name={c.name} desc={c.desc} added={existingIds.has(c.id)}
              badges={`${b('purple', '직접 추가')}${c.price ? b('gray', c.price) : ''}`} />
          ))}
        </div>
      )}

      {cat === 'museum' && order(MUSEUMS as Museum[]).map((g) => (
        <div key={g.label}>
          <div className="add-sec">{g.label}</div>
          {g.items.map((m) => (
            <Row key={m.id} id={m.id} type="museum" name={m.name} desc={m.desc} added={existingIds.has(m.id)}
              badges={`${b('blue', m.price)}${b('gray', m.dur)}${m.closed !== '없음' ? b('red', m.closed + ' 휴관') : ''}${m.free ? b('free', '무료') : ''}`} />
          ))}
        </div>
      ))}

      {cat === 'food' && order(FOODS as Food[]).map((g) => (
        <div key={g.label}>
          <div className="add-sec">{g.label}</div>
          {g.items.map((f) => (
            <Row key={f.id} id={f.id} type="food" name={f.name} desc={f.desc} added={existingIds.has(f.id)}
              badges={`${b('orange', f.price)}${b('gray', f.cat)}${f.rsv.includes('필수') ? b('pink', '예약 ' + f.rsv) : ''}${f.note ? b('orange', f.note) : ''}`} />
          ))}
        </div>
      ))}

      {cat === 'tour' && order(TOURS as Tour[]).map((g) => (
        <div key={g.label}>
          <div className="add-sec">{g.label}</div>
          {g.items.map((t) => (
            <Row key={t.id} id={t.id} type="tour" name={t.name} added={existingIds.has(t.id)}
              badges={`${b('green', t.price)}${b('gray', t.dur)}${t.note ? b('orange', t.note) : ''}`} />
          ))}
        </div>
      ))}

      {cat === 'spot' && order(SPOTS as Spot[]).map((g) => (
        <div key={g.label}>
          <div className="add-sec">{g.label}</div>
          {g.items.map((s) => (
            <Row key={s.id} id={s.id} type="spot" name={s.name} desc={s.desc} added={existingIds.has(s.id)}
              badges={b('teal', s.cat)} />
          ))}
        </div>
      ))}
    </div>
  );
}
