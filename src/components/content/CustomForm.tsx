'use client';

import { useState } from 'react';
import type { City, ContentType, CustomItem } from '@/types';
import { useScheduleStore } from '@/stores/schedule';
import { useToast } from '@/components/ui/Toast';

interface CustomFormProps {
  cat: ContentType;
  city: City;
}

export default function CustomForm({ cat, city }: CustomFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const addCustom = useScheduleStore((s) => s.addCustom);
  const toast = useToast((s) => s.show);

  const catLabel = ({ museum: '미술관', food: '맛집', tour: '투어', spot: '관광지' } as Record<string, string>)[cat] || cat;
  const cityLabel = city === 'nice' ? '니스' : '파리';

  function handleSubmit() {
    if (!name.trim()) { toast('이름을 입력하세요'); return; }
    const zo = city === 'nice' ? 'nice-center' : 'paris-louvre';
    const isUrl = link.startsWith('http') || link.startsWith('www');
    const newItem: CustomItem = {
      id: 'CU' + Date.now(), name: name.trim(), desc: desc.trim(), price: price.trim(),
      type: cat, city, zone: zo, cat: cat === 'food' ? '캐주얼' : cat === 'spot' ? '기타' : '',
      rsv: '불필요', gmap: isUrl ? name.trim() + ' ' + cityLabel : link.trim() || name.trim() + ' ' + cityLabel,
    };
    if (isUrl) newItem.link = link.trim();
    addCustom(newItem);
    toast(name.trim() + ' 추가됨');
    setName(''); setDesc(''); setPrice(''); setLink(''); setOpen(false);
  }

  const placeholder = ({ museum: '퐁피두 센터', food: '카페 드 플로르', tour: '몽생미셸 투어', spot: '시테섬 산책' } as Record<string, string>)[cat] || '';

  return (
    <div>
      <button className="custom-toggle" onClick={() => setOpen(!open)}>
        ✏️ {cityLabel} {catLabel} 직접 추가하기
      </button>
      {open && (
        <div className="custom-form">
          <label>이름 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`예: ${placeholder}`} />
          <label>설명 (선택)</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="간단한 설명" />
          <label>가격 (선택)</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="예: €€ 또는 15~25€" />
          <label>링크 (선택)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="구글맵 링크, 예약 페이지, 블로그 등 아무 URL" />
          <button className="custom-submit" onClick={handleSubmit}>컨텐츠에 추가</button>
        </div>
      )}
    </div>
  );
}
