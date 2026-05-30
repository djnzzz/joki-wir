import { create } from "zustand";

export type ToastType = "sukses" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number; // ms, default per type
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION: Record<ToastType, number> = {
  sukses: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  add: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id,
          duration: toast.duration ?? DEFAULT_DURATION[toast.type],
        },
      ],
    }));
    return id;
  },

  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clear: () => set({ toasts: [] }),
}));
