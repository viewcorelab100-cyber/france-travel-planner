import type { MajorTransit } from '@/types';

interface TransitCardProps {
  transit: MajorTransit;
}

export default function TransitCard({ transit }: TransitCardProps) {
  return (
    <div className="transit-card">
      <div className="transit-title">🚄 {transit.label}</div>
      {transit.options.map((o, i) => (
        <div key={i} className="transit-opt">
          <div>
            <div className="transit-name">{o.icon} {o.name}</div>
            <div className="transit-desc">{o.dur} · {o.desc}</div>
          </div>
          <div className="transit-price">{o.price}</div>
        </div>
      ))}
      <a className="transit-book" href={transit.bookLink} target="_blank" rel="noopener noreferrer">
        SNCF Connect에서 예약하기 →
      </a>
    </div>
  );
}
