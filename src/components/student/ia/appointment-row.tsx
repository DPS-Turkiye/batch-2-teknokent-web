import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { AppointmentStatusBadge } from "@/components/student/ia/ui";
import type { Appointment } from "@/interfaces/appointment";
import { timeLabel } from "@/lib/calendar";
import { dateTile } from "@/lib/coordinator-program-detail";

/** Figma "Appointment Card": a date badge (10 / KAS) and who, when and what; the whole card opens `href`. */
export function AppointmentRow({
  appointment,
  href,
}: {
  appointment: Appointment;
  href: string;
}) {
  const t = useTranslations("iaStudent.common");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  const badge = dateTile(appointment.startsAt, locale);
  const { counterpart } = appointment;
  const details = [
    `${timeLabel(appointment.startsAt, locale)} – ${timeLabel(appointment.endsAt, locale)}`,
    t(`kind.${appointment.kind}`),
    appointment.category ? tTopic(appointment.category) : null,
  ].filter(Boolean);

  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-card border border-border-subtle bg-background-surface p-5 transition hover:shadow-hover"
    >
      <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-background-surface">
        <span className="type-h3 text-text-accent">{badge.day}</span>
        <span className="type-overline text-text-secondary">{badge.month}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate type-label-lg text-text-primary">
            {[counterpart.title, counterpart.fullName]
              .filter(Boolean)
              .join(" ")}
          </span>
          <span className="flex items-center gap-1 type-body-sm text-text-secondary">
            <Clock aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{details.join(" · ")}</span>
          </span>
        </span>
        <AppointmentStatusBadge status={appointment.status} />
      </span>
    </Link>
  );
}
