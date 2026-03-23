'use client';

import { create } from 'zustand';
import type { ScheduleItem, CustomItem } from '@/types';
import { supabase } from '@/lib/supabase';

interface ScheduleState {
  sch: Record<string, ScheduleItem[]>;
  custom: CustomItem[];
  ready: boolean;
  addItem: (date: string, item: ScheduleItem) => void;
  removeItem: (date: string, index: number) => void;
  addCustom: (item: CustomItem) => void;
  removeCustom: (id: string) => void;
  init: () => void;
}

// Supabase에 일정 저장
async function saveSch(date: string, items: ScheduleItem[]) {
  if (items.length === 0) {
    await supabase.from('schedules').delete().eq('date', date);
  } else {
    await supabase.from('schedules').upsert({ date, items, updated_at: new Date().toISOString() });
  }
}

// Supabase에 커스텀 아이템 저장 (단일 row로 관리)
async function saveCustom(custom: CustomItem[]) {
  await supabase.from('schedules').upsert({ date: '__custom__', items: custom, updated_at: new Date().toISOString() });
}

export const useScheduleStore = create<ScheduleState>()((set, get) => ({
  sch: {},
  custom: [],
  ready: false,

  addItem: (date, item) => {
    set((s) => {
      const newSch = { ...s.sch, [date]: [...(s.sch[date] || []), item] };
      saveSch(date, newSch[date]);
      return { sch: newSch };
    });
  },

  removeItem: (date, index) => {
    set((s) => {
      const items = [...(s.sch[date] || [])];
      items.splice(index, 1);
      const sch = { ...s.sch };
      if (items.length === 0) delete sch[date];
      else sch[date] = items;
      saveSch(date, items);
      return { sch };
    });
  },

  addCustom: (item) => {
    set((s) => {
      const custom = [...s.custom, item];
      saveCustom(custom);
      return { custom };
    });
  },

  removeCustom: (id) => {
    set((s) => {
      const custom = s.custom.filter((x) => x.id !== id);
      saveCustom(custom);
      return { custom };
    });
  },

  init: async () => {
    // 1. localStorage에서 기존 데이터 읽기 (마이그레이션용)
    let localSch: Record<string, ScheduleItem[]> = {};
    let localCustom: CustomItem[] = [];
    try {
      const raw = localStorage.getItem('ftp_v4');
      if (raw) {
        const parsed = JSON.parse(raw);
        localSch = parsed.state?.sch || {};
        localCustom = parsed.state?.custom || [];
      }
    } catch { /* ignore */ }

    // 2. Supabase에서 데이터 로드
    const { data } = await supabase.from('schedules').select('*');
    const rows = data || [];

    const sch: Record<string, ScheduleItem[]> = {};
    let custom: CustomItem[] = [];

    for (const row of rows) {
      if (row.date === '__custom__') {
        custom = (row.items as CustomItem[]) || [];
      } else {
        sch[row.date] = (row.items as ScheduleItem[]) || [];
      }
    }

    // 3. Supabase가 비어있고 로컬에 데이터가 있으면 마이그레이션
    const supabaseEmpty = rows.length === 0;
    const localHasData = Object.keys(localSch).length > 0 || localCustom.length > 0;

    if (supabaseEmpty && localHasData) {
      // 로컬 데이터를 Supabase로 업로드
      const upserts = Object.entries(localSch).map(([date, items]) => ({
        date, items, updated_at: new Date().toISOString(),
      }));
      if (localCustom.length > 0) {
        upserts.push({ date: '__custom__', items: localCustom as unknown as ScheduleItem[], updated_at: new Date().toISOString() });
      }
      if (upserts.length > 0) {
        await supabase.from('schedules').upsert(upserts);
      }
      set({ sch: localSch, custom: localCustom, ready: true });
    } else {
      set({ sch, custom, ready: true });
    }

    // 4. Realtime 구독
    supabase
      .channel('schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, (payload) => {
        const row = payload.new as { date: string; items: unknown[] } | undefined;
        if (!row) {
          // DELETE
          const old = payload.old as { date: string } | undefined;
          if (old && old.date !== '__custom__') {
            set((s) => {
              const sch = { ...s.sch };
              delete sch[old.date];
              return { sch };
            });
          }
          return;
        }
        if (row.date === '__custom__') {
          set({ custom: (row.items as CustomItem[]) || [] });
        } else {
          set((s) => ({
            sch: { ...s.sch, [row.date]: (row.items as ScheduleItem[]) || [] },
          }));
        }
      })
      .subscribe();
  },
}));
