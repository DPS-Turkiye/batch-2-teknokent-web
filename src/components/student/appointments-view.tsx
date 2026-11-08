"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import { useLocale, useTranslations } from "next-intl";
import { PageHeading, Panel } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/common/empty-state";
import { AppointmentRoleLabel } from "@/components/appointments/appointment-role-label";
import { AppointmentStatusChip } from "@/components/appointments/appointment-status-chip";
import { useStudentAppointments } from "@/hooks/use-student-appointments";
import { AppointmentStatus } from "@/interfaces/appointment";
import { formatDateTime } from "@/lib/utils";

export function StudentAppointmentsView() {
  const t = useTranslations("studentAppointments");
  const labels = useTranslations("appointments.status");
  const locale = useLocale();
  const appointments = useStudentAppointments();
  return (
    <div className="space-y-6">
      <PageHeading title={t("title")} subtitle={t("fixtureNotice")} />
      <label className="flex flex-wrap items-center gap-3 text-sm">
        {t("filter")}
        <select
          className="rounded-xl border border-[#d4d8dd] bg-white px-3 py-2"
          value={appointments.status ?? ""}
          onChange={(event) =>
            appointments.setStatus(
              event.target.value
                ? (event.target.value as AppointmentStatus)
                : null,
            )
          }
        >
          <option value="">{t("all")}</option>
          {Object.values(AppointmentStatus).map((status) => (
            <option key={status} value={status}>
              {labels(status)}
            </option>
          ))}
        </select>
      </label>
      {appointments.isLoading ? (
        <p role="status">{t("loading")}</p>
      ) : appointments.error ? (
        <div role="alert" className="space-y-3">
          <p>{t("error")}</p>
          <button
            type="button"
            className="rounded-full border px-4 py-2"
            disabled={appointments.isRetrying}
            onClick={appointments.retry}
          >
            {t("retry")}
          </button>
        </div>
      ) : appointments.appointments.length === 0 ? (
        <EmptyState
          title={appointments.isEmpty ? t("empty") : t("filteredEmpty")}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-[#eef0f2]" aria-label={t("title")}>
            {appointments.appointments.map((item) => (
              <li key={item.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 break-words">
                    <h2 className="text-base font-semibold">{item.topic}</h2>
                    <p className="mt-1 text-sm text-[#676e78]">
                      {[item.counterpart.title, item.counterpart.fullName]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    {item.counterpart.department ? (
                      <p className="text-sm text-[#676e78]">
                        {item.counterpart.department}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AppointmentRoleLabel kind={item.kind} side={item.side} />
                    <AppointmentStatusChip status={item.status} />
                  </div>
                </div>
                <p className="text-sm">
                  <time dateTime={item.startsAt}>
                    {formatDateTime(item.startsAt, locale)}
                  </time>{" "}
                  –{" "}
                  <time dateTime={item.endsAt}>
                    {formatDateTime(item.endsAt, locale)}
                  </time>
                </p>
                {item.place ? (
                  <p className="text-sm">{t("place", { place: item.place })}</p>
                ) : null}
                {item.status === AppointmentStatus.AlternativeProposed &&
                item.alternative ? (
                  <p className="text-sm text-[#676e78]">
                    {t("alternative")}:{" "}
                    {formatDateTime(item.alternative.startsAt, locale)} –{" "}
                    {formatDateTime(item.alternative.endsAt, locale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
