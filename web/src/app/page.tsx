'use client';

import Timeline from '@/components/timeline/Timeline';

export default function Home() {
  return (
    <div>
      <div className="page-header">
        <h1>프랑스 여행</h1>
        <div className="sub">엄마와 둘이 · 니스+파리 · 3/30~4/9</div>
      </div>
      <Timeline />
    </div>
  );
}
