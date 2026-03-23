'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface MemoState {
  memos: Record<string, string>;   // date → content
  ready: boolean;
  setMemo: (date: string, content: string) => void;
  getMemo: (date: string) => string;
  init: () => void;
}

export const useMemoStore = create<MemoState>()((set, get) => ({
  memos: {},
  ready: false,

  setMemo: (date, content) => {
    set((s) => ({ memos: { ...s.memos, [date]: content } }));
    if (content.trim() === '') {
      supabase.from('memos').delete().eq('date', date);
    } else {
      supabase.from('memos').upsert({ date, content, updated_at: new Date().toISOString() });
    }
  },

  getMemo: (date) => get().memos[date] || '',

  init: async () => {
    const { data } = await supabase.from('memos').select('*');
    const memos: Record<string, string> = {};
    for (const row of (data || [])) {
      memos[row.date] = row.content;
    }
    set({ memos, ready: true });

    // Realtime
    supabase
      .channel('memos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memos' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as { date: string } | undefined;
          if (old) {
            set((s) => {
              const memos = { ...s.memos };
              delete memos[old.date];
              return { memos };
            });
          }
          return;
        }
        const row = payload.new as { date: string; content: string };
        if (row) {
          set((s) => ({ memos: { ...s.memos, [row.date]: row.content } }));
        }
      })
      .subscribe();
  },
}));
