import type { ScheduleItem, Museum, Food, Tour, Spot, CustomItem } from '@/types';
import MUSEUMS from '@/data/museums.json';
import FOODS from '@/data/foods.json';
import TOURS from '@/data/tours.json';
import SPOTS from '@/data/spots.json';
import ZONE_ORDER from '@/data/zones.json';
import ZT from '@/data/zone-travel.json';

type AnyItem = Museum | Food | Tour | Spot | CustomItem | null;

export function findItem(id: string, type: string, customItems: CustomItem[] = []): AnyItem {
  if (type === 'museum') return (MUSEUMS as Museum[]).find((x) => x.id === id) || null;
  if (type === 'food') return (FOODS as Food[]).find((x) => x.id === id) || null;
  if (type === 'tour') return (TOURS as Tour[]).find((x) => x.id === id) || null;
  if (type === 'spot') return (SPOTS as Spot[]).find((x) => x.id === id) || null;
  const c = customItems.find((x) => x.id === id);
  if (c) return c;
  return null;
}

export function getZone(item: ScheduleItem, customItems: CustomItem[] = []): string {
  const src = findItem(item.id, item.type, customItems);
  if (src && 'zone' in src) return src.zone || 'zzz';
  return item.zone || 'zzz';
}

export function getGmap(item: ScheduleItem, customItems: CustomItem[] = []): string {
  const src = findItem(item.id, item.type, customItems);
  if (src && 'gmap' in src) return src.gmap || item.name;
  return item.gmap || item.name;
}

export function sortByZone(items: ScheduleItem[], ck: string, customItems: CustomItem[] = []): ScheduleItem[] {
  const city = ck === 'nice' ? 'nice' : ck === 'paris' ? 'paris' : null;
  if (!city) return items;
  const zo = (ZONE_ORDER as Record<string, string[]>)[city] || [];
  return [...items].sort((a, b) => {
    const ai = zo.indexOf(getZone(a, customItems));
    const bi = zo.indexOf(getZone(b, customItems));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

// "1~1.5h" → 75, "30min" → 30, "반나절" → 240
export function parseDur(str?: string): number {
  if (!str) return 45;
  const hm = str.match(/(\d+\.?\d*)~(\d+\.?\d*)\s*h/i);
  if (hm) return Math.round(((parseFloat(hm[1]) + parseFloat(hm[2])) / 2) * 60);
  const h1 = str.match(/(\d+\.?\d*)\s*h/i);
  if (h1) return Math.round(parseFloat(h1[1]) * 60);
  const mm = str.match(/(\d+)\s*min/i);
  if (mm) return parseInt(mm[1]);
  if (str.includes('반나절')) return 240;
  return 45;
}

export function zoneTravelMin(zA: string | null, zB: string | null): number {
  if (!zA || !zB || zA === zB) return 5;
  const k1 = zA + '|' + zB;
  const k2 = zB + '|' + zA;
  const zt = ZT as Record<string, number>;
  return zt[k1] || zt[k2] || 20;
}

export function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${m < 10 ? '0' + m : m}`;
}
