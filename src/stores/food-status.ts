'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FoodState = 'none' | 'eaten' | 'pass';

interface FoodStatusState {
  status: Record<string, FoodState>;
  cycle: (id: string) => void;
  getStatus: (id: string) => FoodState;
}

const CYCLE: FoodState[] = ['none', 'eaten', 'pass'];

export const useFoodStatusStore = create<FoodStatusState>()(
  persist(
    (set, get) => ({
      status: {},
      cycle: (id) =>
        set((s) => {
          const cur = s.status[id] || 'none';
          const next = CYCLE[(CYCLE.indexOf(cur) + 1) % 3];
          return { status: { ...s.status, [id]: next } };
        }),
      getStatus: (id) => get().status[id] || 'none',
    }),
    { name: 'ftp_food_v4' }
  )
);
