// Local pieces of the IA Revizyon kit ("00 — Ortak bileşenler") for the student screens, built here
// until the shared kit lands; the colours read the kit's tokens and fall back to the Figma values.
import {
  CalendarClock,
  Check,
  CircleCheck,
  Clock,
  Hourglass,
  Lightbulb,
  RotateCcw,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppointmentStatus } from "@/interfaces/appointment";
import { initials } from "@/lib/utils";

export const iaText = {
  primary: "text-[color:var(--color-text-primary,#1c2026)]",
  secondary: "text-[color:var(--color-text-secondary,#575f69)]",
  muted: "text-[color:var(--color-text-muted,#6e7681)]",
  accent: "text-[color:var(--color-text-accent,#d0112b)]",
};

export const iaCard =
  "rounded-[24px] border border-[var(--color-border-subtle,#e5e9ed)] bg-[var(--color-background-surface,white)]";

const buttonBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-5 text-[14px] leading-5 font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50";

export const iaButton = {
  primary: `${buttonBase} bg-[var(--color-action-primary-bg,#d0112b)] text-[color:var(--color-action-primary-fg,white)] shadow-[0_1px_1.5px_rgba(28,32,38,0.05),0_1px_1px_rgba(28,32,38,0.04)] hover:bg-[#b00e24]`,
  secondary: `${buttonBase} border border-[var(--color-border-default,#dce1e6)] bg-white text-[color:var(--color-text-primary,#1c2026)] hover:bg-[#f6f7f9]`,
  soft: `${buttonBase} bg-[var(--color-background-selected,#fdedef)] text-[color:var(--color-action-secondary-fg,#b00e24)] hover:bg-[#fbdde1]`,
  small:
    "inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-[13px] leading-[18px] font-semibold text-[color:var(--color-action-primary-bg,#d0112b)] shadow-[0_1px_1.5px_rgba(28,32,38,0.05),0_1px_1px_rgba(28,32,38,0.04)]",
};

export function InitialsAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-8 text-[12px]",
    md: "size-10 text-[14px]",
    lg: "size-14 text-[18px] font-bold",
  };
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-[var(--color-background-selected,#fdedef)] font-medium ${iaText.accent} ${sizes[size]}`}
    >
      {initials(name)}
    </span>
  );
}

type PillTone = "success" | "warning" | "info" | "danger" | "neutral";

const PILL_TONES: Record<PillTone, string> = {
  success:
    "bg-[var(--color-status-success-bg,#eefaf3)] text-[color:var(--color-status-success-text,#0f7a4d)]",
  warning:
    "bg-[var(--color-status-warning-bg,#fff8e1)] text-[color:var(--color-status-warning-text,#8a6100)]",
  info: "bg-[var(--color-status-info-bg,#eef0fd)] text-[color:var(--color-status-info-text,#3b45b5)]",
  danger:
    "bg-[var(--color-status-danger-bg,#fdedef)] text-[color:var(--color-status-danger-text,#b00e24)]",
  neutral: "bg-[#f1f3f5] text-[color:var(--color-text-secondary,#575f69)]",
};

const STATUS_PILL: Record<AppointmentStatus, { tone: PillTone; icon: LucideIcon }> = {
  [AppointmentStatus.Confirmed]: { tone: "success", icon: CircleCheck },
  [AppointmentStatus.Pending]: { tone: "warning", icon: Hourglass },
  [AppointmentStatus.AlternativeProposed]: { tone: "info", icon: CalendarClock },
  [AppointmentStatus.Rejected]: { tone: "danger", icon: X },
  [AppointmentStatus.Cancelled]: { tone: "danger", icon: X },
  [AppointmentStatus.Expired]: { tone: "neutral", icon: Clock },
  [AppointmentStatus.Withdrawn]: { tone: "neutral", icon: RotateCcw },
};

export function Pill({
  tone,
  icon: Icon,
  children,
}: {
  tone: PillTone;
  icon?: LucideIcon | undefined;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-full pr-3 pl-2.5 text-[12px] leading-4 font-medium whitespace-nowrap ${PILL_TONES[tone]} ${Icon ? "" : "pl-3"}`}
    >
      {Icon ? <Icon aria-hidden className="size-4" strokeWidth={1.5} /> : null}
      {children}
    </span>
  );
}

export function AppointmentStatusPill({ status }: { status: AppointmentStatus }) {
  const t = useTranslations("appointments.status");
  const { tone, icon } = STATUS_PILL[status];
  return (
    <Pill tone={tone} icon={icon}>
      {t(status)}
    </Pill>
  );
}

export function SectionHeader({
  id,
  title,
  hint,
  action,
}: {
  id: string;
  title: string;
  hint?: string | undefined;
  action?: { href: string; label: string } | undefined;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2
          id={id}
          className={`text-[16px] leading-[22px] font-semibold ${iaText.primary}`}
        >
          {title}
        </h2>
        {hint ? (
          <span className={`text-[12px] leading-4 ${iaText.muted}`}>{hint}</span>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className={`text-[14px] leading-5 font-medium ${iaText.accent} hover:underline`}
        >
          {action.label} <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}

/** "Neden önerildi?": at most three plain reasons, the menton transparency principle. */
export function ReasonBox({ reasons }: { reasons: string[] }) {
  const t = useTranslations("studentIa.common");
  return (
    <div className="flex flex-col gap-2 rounded-[24px] border border-[var(--color-action-primary-bg,#d0112b)] p-4">
      <p className={`flex items-center gap-2 text-[14px] leading-5 font-medium ${iaText.accent}`}>
        <Lightbulb aria-hidden className="size-5" strokeWidth={1.5} />
        {t("whyRecommended")}
      </p>
      <ul className="flex flex-col gap-2">
        {reasons.slice(0, 3).map((reason) => (
          <li
            key={reason}
            className={`flex items-start gap-2 text-[13px] leading-5 ${iaText.primary}`}
          >
            <Check
              aria-hidden
              className={`mt-0.5 size-4 shrink-0 ${iaText.accent}`}
              strokeWidth={1.5}
            />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
