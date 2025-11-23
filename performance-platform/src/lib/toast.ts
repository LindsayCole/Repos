'use client';

import { create } from 'zustand';
import { ToastData, ToastType } from '@/components/ui/Toast';

interface ToastStore {
  toasts: ToastData[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 11);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

export function useToast() {
  const { addToast } = useToastStore();

  return {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
  };
}

export function useToastContainer() {
  const { toasts, removeToast } = useToastStore();
  return { toasts, removeToast };
}
