// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useLocale, useTranslations } from "next-intl";

import { AppointmentRoleLabel } from "@/components/appointments/appointment-role-label";
import { AppointmentStatusChip } from "@/components/appointments/appointment-status-chip";
import { AppointmentStatus, type Appointment } from "@/interfaces/appointment";
import { timeLabel } from "@/lib/calendar";
import { formatDateTime, httpUrlOrNull } from "@/lib/utils";

/**
 * One appointment in the mentee-home card style: who and where from, the subject, when, its side
 * and status, and a join link while a confirmed online session is still ahead.
 */
export function AppointmentCard({
  appointment,
  upcoming,
}: {
  appointment: Appointment;
  upcoming: boolean;
}) {
  const t = useTranslations("appointments.card");
  const tTopic = useTranslations("peerTopics");
  const locale = useLocale();
  const { counterpart } = appointment;
  const who = [counterpart.title, counterpart.fullName]
    .filter(Boolean)
    .join(" ");
  const heading = appointment.category
    ? tTopic(appointment.category)
    : appointment.topic;
  const joinUrl =
    upcoming && appointment.status === AppointmentStatus.Confirmed
      ? httpUrlOrNull(appointment.onlineUrl)
      : null;

  return (
    <article className="flex flex-col gap-2.5 rounded-[20px] border border-[#e4e7ea] bg-white px-[18px] py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] leading-[19px] text-[#676e78]">
            {[who, counterpart.department].filter(Boolean).join(" · ")}
          </p>
          <h3 className="text-[15px] leading-[22px] font-semibold break-words text-[#22262b]">
            {heading}
          </h3>
          <p className="text-xs leading-[18px] text-[#858c96]">
            <time dateTime={appointment.startsAt}>
              {formatDateTime(appointment.startsAt, locale)}
            </time>
            {" – "}
            <time dateTime={appointment.endsAt}>
              {timeLabel(appointment.endsAt, locale)}
            </time>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
          <AppointmentRoleLabel
            kind={appointment.kind}
            side={appointment.side}
          />
          <AppointmentStatusChip status={appointment.status} />
        </div>
      </div>
      {appointment.category && appointment.topic ? (
        <p className="line-clamp-2 text-[13px] leading-[19px] break-words text-[#4a5059]">
          {appointment.topic}
        </p>
      ) : null}
      {appointment.place ? (
        <p className="text-[13px] text-[#4a5059]">
          {t("place", { place: appointment.place })}
        </p>
      ) : null}
      {appointment.status === AppointmentStatus.AlternativeProposed &&
      appointment.alternative ? (
        <p className="text-[13px] text-[#676e78]">
          {t("alternative")}:{" "}
          {formatDateTime(appointment.alternative.startsAt, locale)} –{" "}
          {timeLabel(appointment.alternative.endsAt, locale)}
        </p>
      ) : null}
      {appointment.status === AppointmentStatus.Rejected &&
      appointment.rejectReason ? (
        <p className="text-[13px] text-[#676e78]">
          {t("rejectReason", { reason: appointment.rejectReason })}
        </p>
      ) : null}
      {joinUrl ? (
        <div className="flex justify-end">
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#ffb28a] px-3.5 py-2 text-[12.5px] leading-[18px] font-medium text-white hover:bg-[#f79a6b]"
          >
            {t("join")}
          </a>
        </div>
      ) : null}
    </article>
  );
}
