"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ToastTone } from "@/interfaces/toast";
import { useToastStore, type ToastItem } from "@/stores/toast-store";

const toneStyles: Record<ToastTone, string> = {
  [ToastTone.Success]: "border-[#b7dfc7] bg-[#f0faf4] text-[#176b3a]",
  [ToastTone.Error]: "border-[#f0b9b5] bg-[#fff5f4] text-[#9f2d26]",
  [ToastTone.Info]: "border-[#bed5f2] bg-[#f4f8fd] text-[#315f91]",
};

const toneIcons: Record<ToastTone, typeof Info> = {
  [ToastTone.Success]: CheckCircle2,
  [ToastTone.Error]: CircleAlert,
  [ToastTone.Info]: Info,
};

// Errors interrupt screen readers; the other tones wait their turn.
const toneRoles: Record<ToastTone, "alert" | "status"> = {
  [ToastTone.Success]: "status",
  [ToastTone.Error]: "alert",
  [ToastTone.Info]: "status",
};

type ToastProps = { toast: ToastItem; onDismiss: (id: number) => void };

function ActionToast({
  toast,
  action,
  onDismiss,
}: ToastProps & { action: NonNullable<ToastItem["action"]> }) {
  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-[640px] items-center gap-3 rounded-full bg-[#22262b] py-2.5 pr-2.5 pl-4 text-white shadow-[0_12px_32px_rgba(33,38,43,0.28)]"
    >
      <span
        className="size-2.5 shrink-0 rounded-full bg-[#3dce7a]"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {toast.title && (
          <strong className="block truncate text-[14px] leading-5 font-semibold">
            {toast.title}
          </strong>
        )}
        <p className="truncate text-[13px] leading-5 text-white/70">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          action.onClick();
          onDismiss(toast.id);
        }}
        className="shrink-0 rounded-full bg-white px-4 py-2 text-[13.5px] font-semibold text-[#22262b]"
      >
        {action.label}
      </button>
    </div>
  );
}

function PlainToast({ toast, onDismiss }: ToastProps) {
  const Icon = toneIcons[toast.tone];
  return (
    <div
      role={toneRoles[toast.tone]}
      className={`pointer-events-auto flex w-full max-w-[380px] gap-3 self-end rounded-xl border p-4 shadow-lg ${toneStyles[toast.tone]}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {toast.title && (
          <strong className="block text-sm">{toast.title}</strong>
        )}
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

function ToastView({ toast, onDismiss }: ToastProps) {
  if (toast.action) {
    return (
      <ActionToast toast={toast} action={toast.action} onDismiss={onDismiss} />
    );
  }
  return <PlainToast toast={toast} onDismiss={onDismiss} />;
}

/** Rendered once in the root layout, so any component can raise a toast through useToast without a provider. */
export function Toaster() {
  const t = useTranslations("sharedUi");
  const toasts = useToastStore((state) => state.toasts);
  const { dismiss } = useToastStore((state) => state.actions);

  return (
    <div
      aria-label={t("toastRegion")}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2"
    >
      {toasts.map((toast) => (
        <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}
