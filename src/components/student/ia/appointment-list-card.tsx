import { ArrowRight, Clock, GraduationCap, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AppointmentStatusBadge } from "@/components/student/ia/ui";
import {
  AppointmentKind,
  AppointmentStatus,
  type Appointment,
} from "@/interfaces/appointment";
import { shortWeekday, timeLabel } from "@/lib/calendar";
import { dateTile } from "@/lib/coordinator-program-detail";
import { offeredTimes } from "@/lib/student-office-hours";
import { formatDayMonth } from "@/lib/utils";

const KIND_ICON = {
  [AppointmentKind.OfficeHours]: GraduationCap,
  [AppointmentKind.PeerMentoring]: Users,
} as const;

/**
 * One appointment on Randevularım's list (Figma 82:496): the date badge, who, which kind and its status. While
 * the other side proposed other times it shows the asked-for time and each offered one; `actions` holds that
 * kind's answer buttons.
 */
export function AppointmentListCard({
  appointment,
  actions,
  tourAnchor,
}: {
  appointment: Appointment;
  actions?: ReactNode;
  tourAnchor?: string | undefined;
}) {
  const t = useTranslations("iaStudent.appointments");
  const tKind = useTranslations("iaStudent.common.kind");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  const badge = dateTile(appointment.startsAt, locale);
  const { counterpart } = appointment;
  const KindIcon = KIND_ICON[appointment.kind];
  const start = new Date(appointment.startsAt);
  const subject = appointment.category
    ? `${tTopic(appointment.category)}: ${appointment.topic}`
    : appointment.topic;
  const proposed =
    appointment.status === AppointmentStatus.AlternativeProposed
      ? offeredTimes(appointment)
      : [];
  const reason =
    appointment.status === AppointmentStatus.Rejected ||
    appointment.status === AppointmentStatus.Cancelled
      ? appointment.rejectReason
      : null;

  return (
    <article
      data-tour={tourAnchor}
      className="flex flex-col gap-4 rounded-card border border-border-subtle bg-background-surface p-5"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-background-subtle">
          <span className="type-h3 text-text-primary">{badge.day}</span>
          <span className="type-overline text-text-secondary">
            {badge.month}
          </span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="type-label-lg text-text-primary">
                {[counterpart.title, counterpart.fullName]
                  .filter(Boolean)
                  .join(" ")}
              </h3>
              <span className="inline-flex h-7 items-center gap-1 rounded-full bg-background-muted px-2.5 type-label-sm text-text-primary">
                <KindIcon aria-hidden className="size-4" strokeWidth={1.5} />
                {tKind(appointment.kind)}
              </span>
            </div>
            {proposed.length > 0 ? null : (
              <p className="flex items-center gap-1 type-body-sm text-text-secondary">
                <Clock
                  aria-hidden
                  className="size-4 shrink-0"
                  strokeWidth={1.5}
                />
                <span className="min-w-0 break-words">
                  {[
                    shortWeekday(start, locale),
                    `${timeLabel(appointment.startsAt, locale)} – ${timeLabel(appointment.endsAt, locale)}`,
                    subject,
                  ].join(" · ")}
                </span>
              </p>
            )}
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </div>
      {proposed.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-status-info-bg px-4 py-3">
          <p className="flex flex-col">
            <span className="type-caption text-text-secondary">
              {t("alternative.requested")}
            </span>
            <s className="type-body-sm text-text-secondary">
              {`${formatDayMonth(start, locale)} · ${timeLabel(appointment.startsAt, locale)}`}
            </s>
          </p>
          <ArrowRight
            aria-hidden
            className="size-4 text-status-info-text"
            strokeWidth={1.5}
          />
          <p className="flex flex-col">
            <span className="type-caption text-status-info-text">
              {t("alternative.proposed")}
            </span>
            {proposed.map((time) => (
              <span
                key={time.startsAt}
                className="type-label-lg text-status-info-text"
              >
                {`${formatDayMonth(new Date(time.startsAt), locale)} ${shortWeekday(new Date(time.startsAt), locale)} · ${timeLabel(time.startsAt, locale)}`}
              </span>
            ))}
          </p>
        </div>
      ) : null}
      {appointment.counterpartMessage ? (
        <p className="type-body-sm break-words text-text-secondary">
          {t("counterpartMessage", {
            message: appointment.counterpartMessage,
          })}
        </p>
      ) : null}
      {reason ? (
        <p className="type-body-sm text-text-secondary">
          {t("rejectReason", { reason })}
        </p>
      ) : null}
      {actions ? (
        <div className="flex flex-wrap justify-end gap-3">{actions}</div>
      ) : null}
    </article>
  );
}
