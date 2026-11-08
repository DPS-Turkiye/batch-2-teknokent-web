import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";
type ToastAction = { label: string; onClick: () => void };
export type ToastInput = {
  message: string;
  title?: string;
  tone?: ToastTone;
  action?: ToastAction;
};
export type ToastItem = ToastInput & { id: number; tone: ToastTone };

const VISIBLE_TOASTS = 4;
const TOAST_LIFETIME_MS = 5_000;

type ToastStore = {
  toasts: ToastItem[];
  // Actions live in one object that is never replaced, so useToast hands callers a stable reference they can
  // put in effect and callback dependencies, as the old context value was.
  actions: {
    showToast: (toast: ToastInput) => void;
    dismiss: (id: number) => void;
  };
};

let nextId = 0;

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  actions: {
    showToast: (input) => {
      const id = ++nextId;
      set(({ toasts }) => ({
        toasts: [
          ...toasts.slice(-(VISIBLE_TOASTS - 1)),
          { ...input, id, tone: input.tone ?? "info" },
        ],
      }));
      window.setTimeout(() => get().actions.dismiss(id), TOAST_LIFETIME_MS);
    },
    dismiss: (id) =>
      set(({ toasts }) => ({
        toasts: toasts.filter((toast) => toast.id !== id),
      })),
  },
}));

export function useToast() {
  return useToastStore((state) => state.actions);
}
