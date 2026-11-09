"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.

import Link from "next/link";
import { useTranslations } from "next-intl";

import { PageHeading } from "@/components/admin/admin-ui";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { EmptyState } from "@/components/common/empty-state";
import { useStudentAppointments } from "@/hooks/use-student-appointments";
import type { Appointment } from "@/interfaces/appointment";

const FIND_MENTOR_HREF = "/student/peer-mentoring";

const pill =
  "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium leading-[18px] transition-colors";
const pillOn = "border-[#22262b] bg-[#22262b] text-white";
const pillOff = "border-[#d4d8dd] bg-white text-[#4a5059] hover:bg-[#f8f9fa]";

export function StudentAppointmentsView() {
  const t = useTranslations("studentAppointments");
  const labels = useTranslations("appointments.status");
  const appointments = useStudentAppointments();
  const nothingShown =
    appointments.upcoming.length === 0 && appointments.past.length === 0;

  return (
    <div className="space-y-6">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      {appointments.statuses.length > 1 ? (
        <div
          role="group"
          aria-label={t("filter")}
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={appointments.status === null}
            className={`${pill} ${appointments.status === null ? pillOn : pillOff}`}
            onClick={() => appointments.setStatus(null)}
          >
            {t("all")}
          </button>
          {appointments.statuses.map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={appointments.status === status}
              className={`${pill} ${appointments.status === status ? pillOn : pillOff}`}
              onClick={() => appointments.setStatus(status)}
            >
              {labels(status)}
            </button>
          ))}
        </div>
      ) : null}
      {appointments.isLoading ? (
        <p role="status" className="text-sm text-[#858c96]">
          {t("loading")}
        </p>
      ) : appointments.error ? (
        <div
          role="alert"
          className="space-y-3 rounded-[20px] border border-[#f3d3d4] bg-[#fdf3f3] p-5 text-sm text-[#b42318]"
        >
          <p>{t("error")}</p>
          <button
            type="button"
            className={`${pill} ${pillOff}`}
            disabled={appointments.isRetrying}
            onClick={appointments.retry}
          >
            {t("retry")}
          </button>
        </div>
      ) : appointments.isEmpty ? (
        <EmptyState
          title={t("empty")}
          body={t("emptyBody")}
          action={
            <Link
              href={FIND_MENTOR_HREF}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white"
            >
              {t("findMentor")}
            </Link>
          }
        />
      ) : nothingShown ? (
        <EmptyState title={t("filteredEmpty")} />
      ) : (
        <>
          <AppointmentSection
            id="appointments-upcoming"
            title={t("upcoming")}
            empty={t("upcomingEmpty")}
            items={appointments.upcoming}
            upcoming
          />
          {appointments.past.length > 0 ? (
            <AppointmentSection
              id="appointments-past"
              title={t("past")}
              items={appointments.past}
              upcoming={false}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function AppointmentSection({
  id,
  title,
  empty,
  items,
  upcoming,
}: {
  id: string;
  title: string;
  empty?: string;
  items: Appointment[];
  upcoming: boolean;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-[16px] font-semibold text-[#1d3a5f]">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-[#d6dade] bg-white px-5 py-6 text-sm text-[#858c96]">
          {empty}
        </p>
      ) : (
        <ul aria-labelledby={id} className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <AppointmentCard appointment={item} upcoming={upcoming} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
