import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import {
  AppointmentStatusPill,
  iaCard,
  iaText,
} from "@/components/student/ia/ui";
import type { Appointment } from "@/interfaces/appointment";
import { dateBadgeParts, timeLabel } from "@/lib/calendar";

/** A date badge (10 / KAS) and one line of who, when and what; the whole card opens `href`. */
export function AppointmentRow({
  appointment,
  href,
}: {
  appointment: Appointment;
  href: string;
}) {
  const t = useTranslations("studentIa.common");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  const badge = dateBadgeParts(appointment.startsAt, locale);
  const { counterpart } = appointment;
  const details = [
    `${timeLabel(appointment.startsAt, locale)} – ${timeLabel(appointment.endsAt, locale)}`,
    t(`kind.${appointment.kind}`),
    appointment.category ? tTopic(appointment.category) : null,
  ].filter(Boolean);

  return (
    <Link
      href={href}
      className={`${iaCard} flex items-center gap-4 p-5 transition hover:border-[var(--color-border-default,#dce1e6)]`}
    >
      <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white">
        <span className={`text-[20px] leading-7 font-bold tracking-[-0.1px] ${iaText.accent}`}>
          {badge.day}
        </span>
        <span className={`text-[11px] leading-4 font-semibold tracking-[0.88px] ${iaText.secondary}`}>
          {badge.month}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex min-w-0 flex-col gap-1">
          <span className={`truncate text-[15px] leading-[22px] font-medium ${iaText.primary}`}>
            {[counterpart.title, counterpart.fullName].filter(Boolean).join(" ")}
          </span>
          <span className={`flex items-center gap-1 text-[13px] leading-5 ${iaText.secondary}`}>
            <Clock aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{details.join(" · ")}</span>
          </span>
        </span>
        <AppointmentStatusPill status={appointment.status} />
      </span>
    </Link>
  );
}
