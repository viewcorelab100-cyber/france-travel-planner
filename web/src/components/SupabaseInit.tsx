'use client';

import { useEffect } from 'react';
import { useScheduleStore } from '@/stores/schedule';
import { useFoodStatusStore } from '@/stores/food-status';
import { useChecklistStore } from '@/stores/checklist';
import { useMemoStore } from '@/stores/memo';
import { useHiddenStore } from '@/stores/hidden';

export default function SupabaseInit() {
  useEffect(() => {
    useScheduleStore.getState().init();
    useFoodStatusStore.getState().init();
    useChecklistStore.getState().init();
    useMemoStore.getState().init();
    useHiddenStore.getState().init();
  }, []);

  return null;
}
