'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface ChecklistState {
  chk: Record<string, boolean>;
  ready: boolean;
  toggle: (key: string) => void;
  isChecked: (key: string) => boolean;
  init: () => void;
}

export const useChecklistStore = create<ChecklistState>()((set, get) => ({
  chk: {},
  ready: false,

  toggle: (key) => {
    set((s) => {
      const next = !s.chk[key];
      supabase.from('checklist').upsert({ key, checked: next, updated_at: new Date().toISOString() });
      return { chk: { ...s.chk, [key]: next } };
    });
  },

  isChecked: (key) => get().chk[key] || false,

  init: async () => {
    // 1. localStorage 읽기
    let localChk: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem('ftp_chk_v4');
      if (raw) {
        const parsed = JSON.parse(raw);
        localChk = parsed.state?.chk || {};
      }
    } catch { /* ignore */ }

    // 2. Supabase 로드
    const { data } = await supabase.from('checklist').select('*');
    const rows = data || [];

    const chk: Record<string, boolean> = {};
    for (const row of rows) {
      chk[row.key] = row.checked;
    }

    // 3. 마이그레이션
    const supabaseEmpty = rows.length === 0;
    const localHasData = Object.keys(localChk).length > 0;

    if (supabaseEmpty && localHasData) {
      const upserts = Object.entries(localChk)
        .filter(([, v]) => v === true)
        .map(([key]) => ({
          key, checked: true, updated_at: new Date().toISOString(),
        }));
      if (upserts.length > 0) {
        await supabase.from('checklist').upsert(upserts);
      }
      set({ chk: localChk, ready: true });
    } else {
      set({ chk, ready: true });
    }

    // 4. Realtime
    supabase
      .channel('checklist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist' }, (payload) => {
        const row = payload.new as { key: string; checked: boolean } | undefined;
        if (row) {
          set((s) => ({ chk: { ...s.chk, [row.key]: row.checked } }));
        }
      })
      .subscribe();
  },
}));
