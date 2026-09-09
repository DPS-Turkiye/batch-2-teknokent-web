"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastTone = "success" | "error" | "info";
type ToastInput = { message: string; title?: string; tone?: ToastTone };
type ToastItem = ToastInput & { id: number; tone: ToastTone };

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const toneStyles: Record<ToastTone, string> = {
  success: "border-[#b7dfc7] bg-[#f0faf4] text-[#176b3a]",
  error: "border-[#f0b9b5] bg-[#fff5f4] text-[#9f2d26]",
  info: "border-[#bed5f2] bg-[#f4f8fd] text-[#315f91]",
};

const toneIcons = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const showToast = useCallback(
    (input: ToastInput) => {
      const id = ++nextId.current;
      setToasts((current) => [
        ...current.slice(-3),
        { ...input, id, tone: input.tone ?? "info" },
      ]);
      window.setTimeout(() => dismiss(id), 5_000);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label="İşlem bildirimleri"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]"
      >
        {toasts.map((toast) => {
          const Icon = toneIcons[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full gap-3 rounded-xl border p-4 shadow-lg ${toneStyles[toast.tone]}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                {toast.title ? (
                  <strong className="block text-sm">{toast.title}</strong>
                ) : null}
                <p className="text-sm leading-5">{toast.message}</p>
              </div>
              <button
                type="button"
                aria-label="Bildirimi kapat"
                onClick={() => dismiss(toast.id)}
                className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-black/5"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
