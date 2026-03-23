'use client';

import { create } from 'zustand';

interface ToastState {
  message: string;
  visible: boolean;
  show: (msg: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  visible: false,
  show: (msg) => {
    set({ message: msg, visible: true });
    setTimeout(() => set({ visible: false }), 2000);
  },
}));

export default function Toast() {
  const { message, visible } = useToast();

  return (
    <div className={`toast ${visible ? 'show' : ''}`}>
      {message}
    </div>
  );
}
