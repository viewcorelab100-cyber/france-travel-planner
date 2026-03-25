import type { MajorTransit } from '@/types';

interface TransitCardProps {
  transit: MajorTransit;
}

export default function TransitCard({ transit }: TransitCardProps) {
  return (
    <div className="transit-card">
      <div className="transit-title">{transit.label}</div>
      {transit.booked && (
        <div className="transit-booked">
          <div className="transit-booked-badge">예약완료</div>
          <div className="transit-booked-info">
            <div className="transit-booked-main">
              {transit.booked.type} · {transit.booked.from} {transit.booked.depart} 출발
            </div>
            <div className="transit-booked-sub">
              {transit.booked.dur} → {transit.booked.arrive}
            </div>
          </div>
        </div>
      )}
      {!transit.booked && transit.options.map((o, i) => (
        <div key={i} className="transit-opt">
          <div>
            <div className="transit-name">{o.icon} {o.name}</div>
            <div className="transit-desc">{o.dur} · {o.desc}</div>
          </div>
          <div className="transit-price">{o.price}</div>
        </div>
      ))}
      {!transit.booked && (
        <a className="transit-book" href={transit.bookLink} target="_blank" rel="noopener noreferrer">
          SNCF Connect에서 예약하기 →
        </a>
      )}
    </div>
  );
}
