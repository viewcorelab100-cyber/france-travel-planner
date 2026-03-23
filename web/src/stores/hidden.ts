'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface HiddenState {
  ids: Set<string>;
  ready: boolean;
  hide: (id: string) => void;
  restore: (id: string) => void;
  isHidden: (id: string) => boolean;
  hiddenCount: (ids: string[]) => number;
  init: () => void;
}

export const useHiddenStore = create<HiddenState>()((set, get) => ({
  ids: new Set(),
  ready: false,

  hide: (id) => {
    set((s) => {
      const ids = new Set(s.ids);
      ids.add(id);
      return { ids };
    });
    supabase.from('hidden_items').upsert({ id, updated_at: new Date().toISOString() });
  },

  restore: (id) => {
    set((s) => {
      const ids = new Set(s.ids);
      ids.delete(id);
      return { ids };
    });
    supabase.from('hidden_items').delete().eq('id', id);
  },

  isHidden: (id) => get().ids.has(id),
  hiddenCount: (itemIds) => itemIds.filter((id) => get().ids.has(id)).length,

  init: async () => {
    const { data } = await supabase.from('hidden_items').select('id');
    const ids = new Set((data || []).map((r) => r.id));
    set({ ids, ready: true });

    supabase
      .channel('hidden_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hidden_items' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as { id: string } | undefined;
          if (old) {
            set((s) => {
              const ids = new Set(s.ids);
              ids.delete(old.id);
              return { ids };
            });
          }
        } else {
          const row = payload.new as { id: string };
          if (row) {
            set((s) => {
              const ids = new Set(s.ids);
              ids.add(row.id);
              return { ids };
            });
          }
        }
      })
      .subscribe();
  },
}));
