import type { ReactNode } from "react";

export enum StatusTone {
  Success = "success",
  Warning = "warning",
  Error = "error",
  Info = "info",
  Neutral = "neutral",
}

export const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  [StatusTone.Success]: "bg-status-success-bg text-status-success-text",
  [StatusTone.Warning]: "bg-status-warning-bg text-status-warning-text",
  [StatusTone.Error]: "bg-status-error-bg text-status-error-text",
  [StatusTone.Info]: "bg-status-info-bg text-status-info-text",
  [StatusTone.Neutral]: "bg-status-neutral-bg text-status-neutral-text",
};

/** A small rounded status label ("Aktif", "Taslak", "Rozet Doğrulandı"). */
export function StatusBadge({
  tone,
  icon,
  children,
}: {
  tone: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-6 w-fit items-center gap-1 rounded-full px-2.5 whitespace-nowrap type-label-sm ${STATUS_TONE_CLASSES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
