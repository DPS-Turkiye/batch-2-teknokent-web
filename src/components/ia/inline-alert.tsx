import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { StatusTone } from "@/components/ia/status-badge";

const TONES: Record<
  StatusTone,
  { box: string; title: string; icon: ReactNode }
> = {
  [StatusTone.Success]: {
    box: "border-status-success-border",
    title: "text-status-success-text",
    icon: <CircleCheck className="size-5 text-status-success-icon" />,
  },
  [StatusTone.Warning]: {
    box: "border-status-warning-border",
    title: "text-status-warning-text",
    icon: <TriangleAlert className="size-5 text-status-warning-icon" />,
  },
  [StatusTone.Error]: {
    box: "border-status-error-border",
    title: "text-status-error-text",
    icon: <CircleX className="size-5 text-status-error-icon" />,
  },
  [StatusTone.Info]: {
    box: "border-status-info-border",
    title: "text-status-info-text",
    icon: <Info className="size-5 text-status-info-icon" />,
  },
  [StatusTone.Neutral]: {
    box: "border-status-neutral-border",
    title: "text-status-neutral-text",
    icon: <Info className="size-5 text-status-neutral-icon" />,
  },
};

/**
 * A persistent message inside a page or card (Figma "Inline Alert": tone, title, message). Errors are announced
 * as alerts; the other tones as status.
 */
export function InlineAlert({
  tone,
  title,
  children,
  className = "",
}: {
  tone: StatusTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string | undefined;
}) {
  const style = TONES[tone];
  return (
    <div
      role={tone === StatusTone.Error ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${style.box} ${className}`}
    >
      <span aria-hidden className="shrink-0 [&_svg]:stroke-[1.5]">
        {style.icon}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        {title ? <p className={`type-label ${style.title}`}>{title}</p> : null}
        {children ? (
          <div className="type-body-sm text-text-primary">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
