'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChecklistState {
  chk: Record<string, boolean>;
  toggle: (key: string) => void;
  isChecked: (key: string) => boolean;
}

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      chk: {},
      toggle: (key) =>
        set((s) => ({ chk: { ...s.chk, [key]: !s.chk[key] } })),
      isChecked: (key) => get().chk[key] || false,
    }),
    { name: 'ftp_chk_v4' }
  )
);
