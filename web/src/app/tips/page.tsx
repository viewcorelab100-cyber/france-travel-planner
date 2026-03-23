'use client';

import TIPS from '@/data/tips.json';

export default function TipsPage() {
  return (
    <div>
      <div className="page-header">
        <h1>꿀팁</h1>
        <div className="sub">알면 돈·시간 아끼는 정보</div>
      </div>
      {Object.entries(TIPS).map(([group, items]) => (
        <div key={group} className="tip-sec">
          <div className="tip-title">{group}</div>
          {items.map((tip, i) => (
            <div key={i} className="tip-c">{tip}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
