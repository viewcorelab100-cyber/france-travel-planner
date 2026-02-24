'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScheduleItem, CustomItem } from '@/types';

interface ScheduleState {
  sch: Record<string, ScheduleItem[]>;
  custom: CustomItem[];
  addItem: (date: string, item: ScheduleItem) => void;
  removeItem: (date: string, index: number) => void;
  addCustom: (item: CustomItem) => void;
  removeCustom: (id: string) => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      sch: {},
      custom: [],
      addItem: (date, item) =>
        set((s) => ({
          sch: { ...s.sch, [date]: [...(s.sch[date] || []), item] },
        })),
      removeItem: (date, index) =>
        set((s) => {
          const items = [...(s.sch[date] || [])];
          items.splice(index, 1);
          const sch = { ...s.sch };
          if (items.length === 0) delete sch[date];
          else sch[date] = items;
          return { sch };
        }),
      addCustom: (item) =>
        set((s) => ({ custom: [...s.custom, item] })),
      removeCustom: (id) =>
        set((s) => ({ custom: s.custom.filter((x) => x.id !== id) })),
    }),
    { name: 'ftp_v4' }
  )
);
