'use client';

import SUPPLIES from '@/data/supplies.json';
import { useChecklistStore } from '@/stores/checklist';

export default function ChecklistPage() {
  const { chk, toggle } = useChecklistStore();

  const sections = [
    { key: 'essential', label: '필수', items: SUPPLIES.essential },
    { key: 'recommend', label: '추천', items: SUPPLIES.recommend },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>준비물</h1>
        <div className="sub">체크해가며 준비하세요</div>
      </div>
      {sections.map((sec) => (
        <div key={sec.key}>
          <div className="chk-title">{sec.label}</div>
          <div className="chk-list">
            {sec.items.map((item, i) => {
              const k = `${sec.key}_${i}`;
              const done = chk[k] || false;
              return (
                <div key={k} className={`chk ${done ? 'done' : ''}`} onClick={() => toggle(k)}>
                  <div className="chk-box">{done ? '✓' : ''}</div>
                  <div>
                    <div className="chk-text">{item.t}</div>
                    <div className="chk-memo">{item.m}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
