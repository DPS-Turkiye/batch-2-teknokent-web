"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { TRANSCRIPT_BOT_FULL_EVENT } from "@/lib/transcript-bot";

type ToastTone = "success" | "error" | "info";
type ToastAction = { label: string; onClick: () => void };
type ToastInput = {
  message: string;
  title?: string;
  tone?: ToastTone;
  action?: ToastAction;
};
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
  const t = useTranslations("sharedUi");
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
  useEffect(() => {
    const announce = () =>
      showToast({
        tone: "error",
        title: t("botFullTitle"),
        message: t("botFullMessage"),
      });
    window.addEventListener(TRANSCRIPT_BOT_FULL_EVENT, announce);
    return () =>
      window.removeEventListener(TRANSCRIPT_BOT_FULL_EVENT, announce);
  }, [showToast, t]);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-label={t("toastRegion")}
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2"
      >
        {toasts.map((toast) =>
          toast.action ? (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-[640px] items-center gap-3 rounded-full bg-[#22262b] py-2.5 pr-2.5 pl-4 text-white shadow-[0_12px_32px_rgba(33,38,43,0.28)]"
            >
              <span
                className="size-2.5 shrink-0 rounded-full bg-[#3dce7a]"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                {toast.title ? (
                  <strong className="block truncate text-[14px] leading-5 font-semibold">
                    {toast.title}
                  </strong>
                ) : null}
                <p className="truncate text-[13px] leading-5 text-white/70">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
                className="shrink-0 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-[#22262b]"
              >
                {toast.action.label}
              </button>
            </div>
          ) : (
            <PlainToast key={toast.id} toast={toast} onDismiss={dismiss} />
          ),
        )}
      </div>
    </ToastContext.Provider>
  );
}

function PlainToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const Icon = toneIcons[toast.tone];
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-[380px] gap-3 self-end rounded-xl border p-4 shadow-lg ${toneStyles[toast.tone]}`}
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
        onClick={() => onDismiss(toast.id)}
        className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-black/5"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
