'use client';

import { useState } from 'react';
import type { City, ContentType, Museum, Food, Tour, Spot } from '@/types';
import MUSEUMS from '@/data/museums.json';
import FOODS from '@/data/foods.json';
import TOURS from '@/data/tours.json';
import SPOTS from '@/data/spots.json';
import MUSEUM_INFO from '@/data/museum-info.json';
import { FOOD_SUBS, SPOT_SUBS_NICE, SPOT_SUBS_PARIS, FOOD_STATUS_LABEL } from '@/data/constants';
import { useScheduleStore } from '@/stores/schedule';
import { useFoodStatusStore } from '@/stores/food-status';
import { useHiddenStore } from '@/stores/hidden';
import { useToast } from '@/components/ui/Toast';
import { gmap } from '@/utils/maps';
import CustomForm from '@/components/content/CustomForm';

const LINK_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

function HideBtn({ id }: { id: string }) {
  const { hide } = useHiddenStore();
  const toast = useToast((s) => s.show);
  return (
    <button
      className="hide-btn"
      onClick={(e) => { e.stopPropagation(); hide(id); toast('숨김 처리됨'); }}
      title="숨기기"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  );
}

function HiddenBanner({ count, onRestore }: { count: number; onRestore: () => void }) {
  if (count === 0) return null;
  return (
    <button className="hidden-banner" onClick={onRestore}>
      숨긴 항목 {count}개 보기
    </button>
  );
}

function RestoreCard({ id, name, onRestore }: { id: string; name: string; onRestore: (id: string) => void }) {
  return (
    <div className="ccard restore-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: 'var(--gray500)', textDecoration: 'line-through' }}>{name}</span>
        <button className="restore-btn" onClick={() => onRestore(id)}>복원</button>
      </div>
    </div>
  );
}

export default function ContentPage() {
  const [cat, setCat] = useState<ContentType>('museum');
  const [city, setCity] = useState<City>('nice');
  const [sub, setSub] = useState('전체');
  const [showHidden, setShowHidden] = useState(false);
  const { custom, removeCustom } = useScheduleStore();
  const { status, cycle: cycleFoodStatus } = useFoodStatusStore();
  const { ids: hiddenIds, restore, isHidden } = useHiddenStore();
  const toast = useToast((s) => s.show);

  const customs = custom.filter((c) => c.type === cat && c.city === city);
  const museumInfo = MUSEUM_INFO as Record<string, string>;
  const catLabels: Record<string, string> = { museum: '미술관', food: '맛집', tour: '투어', spot: '관광지' };

  let subs: readonly string[] = [];
  if (cat === 'food') subs = FOOD_SUBS;
  else if (cat === 'spot') subs = city === 'nice' ? SPOT_SUBS_NICE : SPOT_SUBS_PARIS;

  // 현재 카테고리+도시의 전체 ID 목록
  function getAllIds(): string[] {
    if (cat === 'museum') return (MUSEUMS as Museum[]).filter(m => m.city === city).map(m => m.id);
    if (cat === 'food') return (FOODS as Food[]).filter(f => f.city === city).map(f => f.id);
    if (cat === 'tour') return (TOURS as Tour[]).filter(t => t.city === city).map(t => t.id);
    if (cat === 'spot') return (SPOTS as Spot[]).filter(s => s.city === city).map(s => s.id);
    return [];
  }

  const allIds = getAllIds();
  const hiddenCount = allIds.filter((id) => hiddenIds.has(id)).length;

  // 숨긴 항목 이름 가져오기
  function getHiddenItems(): { id: string; name: string }[] {
    return allIds.filter((id) => hiddenIds.has(id)).map((id) => {
      const m = (MUSEUMS as Museum[]).find(x => x.id === id);
      if (m) return { id, name: m.name };
      const f = (FOODS as Food[]).find(x => x.id === id);
      if (f) return { id, name: f.name };
      const t = (TOURS as Tour[]).find(x => x.id === id);
      if (t) return { id, name: t.name };
      const s = (SPOTS as Spot[]).find(x => x.id === id);
      if (s) return { id, name: s.name };
      return { id, name: id };
    });
  }

  function handleRestore(id: string) {
    restore(id);
    toast('복원됨');
  }

  return (
    <div>
      <div className="page-header">
        <h1>컨텐츠</h1>
        <div className="sub">미술관 · 맛집 · 투어 · 관광지</div>
      </div>

      {/* Cat tabs */}
      <div className="cat-tabs">
        {(['museum', 'food', 'tour', 'spot'] as ContentType[]).map((c) => (
          <button key={c} onClick={() => { setCat(c); setSub('전체'); setShowHidden(false); }}
            className={`cat-tab ${cat === c ? 'active' : ''}`}>
            {catLabels[c]}
          </button>
        ))}
      </div>

      {/* City toggle */}
      <div className="city-toggle">
        {(['nice', 'paris'] as City[]).map((c) => (
          <button key={c} onClick={() => { setCity(c); setSub('전체'); setShowHidden(false); }}
            className={`city-toggle-btn ${city === c ? 'active' : ''}`}>
            {c === 'nice' ? '니스' : '파리'}
          </button>
        ))}
      </div>

      {/* Info box */}
      {cat === 'museum' && museumInfo[city] && (
        <div className="info-box blue" dangerouslySetInnerHTML={{ __html: museumInfo[city] }} />
      )}

      {/* Sub filter */}
      {subs.length > 0 && (
        <div className="sub-filter">
          {subs.map((s) => (
            <button key={s} onClick={() => setSub(s)}
              className={`sf-btn ${sub === s ? 'active' : ''}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Card list */}
      <div className="card-list">
        {/* Custom items */}
        {customs.map((cx) => {
          const mainLink = cx.link || gmap(cx.gmap);
          const linkLabel = cx.link ? '링크 열기' : '지도에서 보기';
          return (
            <div key={cx.id} className="ccard" onClick={() => window.open(mainLink, '_blank')}>
              <div className="ccard-row">
                <div className="ccard-emoji">📌</div>
                <div className="ccard-body">
                  <div className="ccard-name">{cx.name} <span className="sm purple">직접 추가</span></div>
                  {cx.desc && <div className="ccard-desc">{cx.desc}</div>}
                  <div className="ccard-badges">{cx.price && <span className="sm gray">{cx.price}</span>}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <div className="ccard-link" dangerouslySetInnerHTML={{ __html: `${LINK_SVG} ${linkLabel}` }} />
                    <span className="ccard-link" style={{ color: 'var(--red)' }} onClick={(e) => {
                      e.stopPropagation(); removeCustom(cx.id); toast('삭제됨');
                    }}>삭제</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Museum */}
        {cat === 'museum' && (MUSEUMS as Museum[]).filter(m => m.city === city && !isHidden(m.id)).map(m => (
          <div key={m.id} className="ccard" onClick={() => window.open(gmap(m.gmap), '_blank')}>
            <HideBtn id={m.id} />
            <div className="ccard-row">
              <div className="ccard-emoji">🎨</div>
              <div className="ccard-body">
                <div className="ccard-name">{m.name}{m.free ? ' ' : ''}{m.free && <span className="sm free">무료</span>}</div>
                <div className="ccard-desc">{m.desc}</div>
                <div className="ccard-badges">
                  <span className="sm blue">{m.price}</span>
                  <span className="sm gray">{m.dur}</span>
                  {m.closed !== '없음' && <span className="sm red">{m.closed} 휴관</span>}
                </div>
                <div className="ccard-link" dangerouslySetInnerHTML={{ __html: `${LINK_SVG} Google 지도에서 보기` }} />
              </div>
            </div>
          </div>
        ))}

        {/* Food */}
        {cat === 'food' && (() => {
          let items = (FOODS as Food[]).filter(f => f.city === city && !isHidden(f.id));
          if (sub === '먹음') items = items.filter(f => (status[f.id] || 'none') === 'eaten');
          else if (sub === '패스') items = items.filter(f => (status[f.id] || 'none') === 'pass');
          else if (sub !== '전체') items = items.filter(f => f.cat === sub);

          if (!items.length) return <div className="empty">해당하는 맛집이 없습니다</div>;
          return items.map(f => {
            const st = status[f.id] || 'none';
            return (
              <div key={f.id} className="ccard" onClick={() => window.open(gmap(f.gmap), '_blank')}>
                <HideBtn id={f.id} />
                <div className="ccard-row">
                  <div className="ccard-emoji">🍽️</div>
                  <div className="ccard-body">
                    <div className="ccard-top">
                      <div>
                        <div className="ccard-name">{f.name}{f.note ? ` ` : ''}{f.note && <span className="sm orange">{f.note}</span>}</div>
                        <div className="ccard-desc">{f.desc}</div>
                      </div>
                      <button className="st-chip" data-s={st} onClick={(e) => { e.stopPropagation(); cycleFoodStatus(f.id); }}>
                        {FOOD_STATUS_LABEL[st]}
                      </button>
                    </div>
                    <div className="ccard-badges">
                      <span className="sm orange">{f.price}</span>
                      <span className="sm gray">{f.cat}</span>
                      {f.rsv.includes('필수') && <span className="sm pink">예약 {f.rsv}</span>}
                    </div>
                    <div className="ccard-link" dangerouslySetInnerHTML={{ __html: `${LINK_SVG} Google 지도에서 보기` }} />
                  </div>
                </div>
              </div>
            );
          });
        })()}

        {/* Tour */}
        {cat === 'tour' && (TOURS as Tour[]).filter(t => t.city === city && !isHidden(t.id)).map(t => (
          <div key={t.id} className="ccard" onClick={() => { if (t.link) window.open(t.link, '_blank'); }}
            style={t.link ? {} : { cursor: 'default' }}>
            <HideBtn id={t.id} />
            <div className="ccard-row">
              <div className="ccard-emoji">🚶</div>
              <div className="ccard-body">
                <div className="ccard-name">{t.name}{t.note ? ` ` : ''}{t.note && <span className="sm orange">{t.note}</span>}</div>
                <div className="ccard-badges">
                  <span className="sm green">{t.price}</span>
                  <span className="sm gray">{t.dur}</span>
                </div>
                {t.link && <div className="ccard-link" dangerouslySetInnerHTML={{ __html: `${LINK_SVG} 예약 페이지 열기` }} />}
              </div>
            </div>
          </div>
        ))}

        {/* Spot */}
        {cat === 'spot' && (() => {
          let items = (SPOTS as Spot[]).filter(s => s.city === city && !isHidden(s.id));
          if (sub !== '전체') items = items.filter(s => s.cat === sub);
          if (!items.length) return <div className="empty">해당하는 관광지가 없습니다</div>;
          return items.map(s => (
            <div key={s.id} className="ccard" onClick={() => window.open(gmap(s.gmap), '_blank')}>
              <HideBtn id={s.id} />
              <div className="ccard-row">
                <div className="ccard-emoji">📍</div>
                <div className="ccard-body">
                  <div className="ccard-name">{s.name}</div>
                  <div className="ccard-desc">{s.desc}</div>
                  <div className="ccard-badges"><span className="sm teal">{s.cat}</span></div>
                  <div className="ccard-link" dangerouslySetInnerHTML={{ __html: `${LINK_SVG} Google 지도에서 보기` }} />
                </div>
              </div>
            </div>
          ));
        })()}

        {/* Hidden items banner + restore */}
        <HiddenBanner count={hiddenCount} onRestore={() => setShowHidden(!showHidden)} />
        {showHidden && getHiddenItems().map((item) => (
          <RestoreCard key={item.id} id={item.id} name={item.name} onRestore={handleRestore} />
        ))}

        <CustomForm cat={cat} city={city} />
      </div>
    </div>
  );
}
