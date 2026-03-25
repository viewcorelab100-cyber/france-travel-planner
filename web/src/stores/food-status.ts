'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

type FoodState = 'none' | 'eaten' | 'pass';

interface FoodStatusState {
  status: Record<string, FoodState>;
  ready: boolean;
  cycle: (id: string) => void;
  getStatus: (id: string) => FoodState;
  init: () => void;
}

const CYCLE: FoodState[] = ['none', 'eaten', 'pass'];

export const useFoodStatusStore = create<FoodStatusState>()((set, get) => ({
  status: {},
  ready: false,

  cycle: async (id) => {
    const cur = get().status[id] || 'none';
    const next = CYCLE[(CYCLE.indexOf(cur) + 1) % 3];
    set((s) => ({ status: { ...s.status, [id]: next } }));
    await supabase.from('food_statuses').upsert({ food_id: id, status: next, updated_at: new Date().toISOString() });
  },

  getStatus: (id) => get().status[id] || 'none',

  init: async () => {
    // 1. localStorage 읽기
    let localStatus: Record<string, FoodState> = {};
    try {
      const raw = localStorage.getItem('ftp_food_v4');
      if (raw) {
        const parsed = JSON.parse(raw);
        localStatus = parsed.state?.status || {};
      }
    } catch { /* ignore */ }

    // 2. Supabase 로드
    const { data } = await supabase.from('food_statuses').select('*');
    const rows = data || [];

    const status: Record<string, FoodState> = {};
    for (const row of rows) {
      status[row.food_id] = row.status as FoodState;
    }

    // 3. 마이그레이션
    const supabaseEmpty = rows.length === 0;
    const localHasData = Object.keys(localStatus).length > 0;

    if (supabaseEmpty && localHasData) {
      const upserts = Object.entries(localStatus)
        .filter(([, v]) => v !== 'none')
        .map(([food_id, s]) => ({
          food_id, status: s, updated_at: new Date().toISOString(),
        }));
      if (upserts.length > 0) {
        await supabase.from('food_statuses').upsert(upserts);
      }
      set({ status: localStatus, ready: true });
    } else {
      set({ status, ready: true });
    }

    // 4. Realtime
    supabase
      .channel('food_statuses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_statuses' }, (payload) => {
        const row = payload.new as { food_id: string; status: FoodState } | undefined;
        if (row) {
          set((s) => ({ status: { ...s.status, [row.food_id]: row.status } }));
        }
      })
      .subscribe();
  },
}));
