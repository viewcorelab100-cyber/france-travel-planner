'use client';

import { gmap } from '@/utils/maps';
import { TYPE_EMOJI } from '@/data/constants';
import type { ContentType } from '@/types';

interface ContentCardProps {
  id: string;
  type: ContentType;
  name: string;
  desc?: string;
  badges: React.ReactNode;
  gmapQuery?: string;
  link?: string;
  linkLabel?: string;
  extra?: React.ReactNode;
  onClick?: () => void;
}

export default function ContentCard({
  type,
  name,
  desc,
  badges,
  gmapQuery,
  link,
  linkLabel,
  extra,
  onClick,
}: ContentCardProps) {
  const emoji = TYPE_EMOJI[type] || '📌';
  const href = link || (gmapQuery ? gmap(gmapQuery) : undefined);
  const label = linkLabel || (link ? '링크 열기' : 'Google 지도에서 보기');

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }
    if (href) window.open(href, '_blank');
  }

  return (
    <div className="ccard" onClick={handleClick}>
      <div className="ccard-row">
        <div className="ccard-emoji">{emoji}</div>
        <div className="ccard-body">
          <div className="ccard-name">{name}</div>
          {desc && <div className="ccard-desc">{desc}</div>}
          <div className="ccard-badges">{badges}</div>
          {extra}
          {href && (
            <div className="ccard-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
