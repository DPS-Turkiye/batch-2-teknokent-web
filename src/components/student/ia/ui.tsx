// Student-screen pieces the shared kit (src/components/ia) does not have yet; candidates for it.
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

import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import { AppointmentStatus } from "@/interfaces/appointment";
import { initials } from "@/lib/utils";

const AVATAR_SIZES = {
  sm: "size-8 type-label-sm",
  md: "size-10 type-label",
  lg: "size-14 type-h4",
} as const;

/** Initials on the theme's selected tint (ODTÜ pink for students). */
export function InitialsAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZES;
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-background-selected text-text-accent ${AVATAR_SIZES[size]}`}
    >
      {initials(name)}
    </span>
  );
}

const STATUS_BADGE: Record<
  AppointmentStatus,
  { tone: StatusTone; icon: LucideIcon }
> = {
  [AppointmentStatus.Confirmed]: {
    tone: StatusTone.Success,
    icon: CircleCheck,
  },
  [AppointmentStatus.Pending]: { tone: StatusTone.Warning, icon: Hourglass },
  [AppointmentStatus.AlternativeProposed]: {
    tone: StatusTone.Info,
    icon: CalendarClock,
  },
  [AppointmentStatus.Rejected]: { tone: StatusTone.Error, icon: X },
  [AppointmentStatus.Cancelled]: { tone: StatusTone.Error, icon: X },
  [AppointmentStatus.Expired]: { tone: StatusTone.Neutral, icon: Clock },
  [AppointmentStatus.Withdrawn]: { tone: StatusTone.Neutral, icon: RotateCcw },
};

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  const t = useTranslations("appointments.status");
  const { tone, icon: Icon } = STATUS_BADGE[status];
  return (
    <StatusBadge
      tone={tone}
      icon={<Icon aria-hidden className="size-4" strokeWidth={1.5} />}
    >
      {t(status)}
    </StatusBadge>
  );
}

/** A section heading with an optional hint beside it and a "Tümünü gör →" link on the right. */
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
        <h2 id={id} className="type-title-card text-text-primary">
          {title}
        </h2>
        {hint ? (
          <span className="type-caption text-text-muted">{hint}</span>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="type-label text-text-link hover:underline"
        >
          {action.label} <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}

/** "Neden önerildi?": at most three plain reasons (the menton transparency principle). */
export function ReasonBox({ reasons }: { reasons: string[] }) {
  const t = useTranslations("iaStudent.common");
  return (
    <div className="flex flex-col gap-2 rounded-card border border-action-accent p-4">
      <p className="flex items-center gap-2 type-label text-text-accent">
        <Lightbulb aria-hidden className="size-5" strokeWidth={1.5} />
        {t("whyRecommended")}
      </p>
      <ul className="flex flex-col gap-2">
        {reasons.slice(0, 3).map((reason) => (
          <li
            key={reason}
            className="flex items-start gap-2 type-body-sm text-text-primary"
          >
            <Check
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-icon-accent"
              strokeWidth={1.5}
            />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
