"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { OfficeHoursAvailabilityDialog } from "@/components/office-hours/office-hours-availability-dialog";
import { useOfficeHoursAvailability } from "@/hooks/use-office-hours-availability";
import { weeklyAvailabilityRows } from "@/lib/mentor-profile-overview";

type AvailabilityRow = ReturnType<typeof weeklyAvailabilityRows>[number];

function AcademicProfileErrorStateView() {
  const t = useTranslations("officeHours.profile");
  return (
    <p role="alert" className="mt-3 text-sm text-[#a65a15]">
      {t("loadFailed")}
    </p>
  );
}

function AcademicProfileLoadingStateView() {
  const t = useTranslations("officeHours.profile");
  return <p className="mt-3 text-sm text-[#858c96]">{t("loading")}</p>;
}

function AcademicProfileEmptyStateView() {
  const t = useTranslations("officeHours.profile");
  return <p className="mt-3 text-sm text-[#858c96]">{t("empty")}</p>;
}

function AcademicProfileAvailabilityListView({
  rows,
}: {
  rows: AvailabilityRow[];
}) {
  return (
    <dl className="mt-3 flex flex-col gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-3 text-[12.5px]"
        >
          <dt className="text-[#676e78]">{row.label}</dt>
          <dd
            className={
              row.muted ? "text-[#858c96]" : "font-medium text-[#22262b]"
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AcademicProfileAvailabilityView({
  failed,
  loading,
  rows,
}: {
  failed: boolean;
  loading: boolean;
  rows: AvailabilityRow[];
}) {
  if (failed) return <AcademicProfileErrorStateView />;
  if (loading) return <AcademicProfileLoadingStateView />;
  if (rows.length === 0) return <AcademicProfileEmptyStateView />;
  return <AcademicProfileAvailabilityListView rows={rows} />;
}

export function AcademicProfileView({ fullName }: { fullName: string }) {
  const t = useTranslations("officeHours.profile");
  const tOptions = useTranslations("options");
  const tSchedule = useTranslations("mentorSchedule");
  const [editing, setEditing] = useState(false);
  const availability = useOfficeHoursAvailability();
  const rows = weeklyAvailabilityRows(availability.data?.rules ?? [], {
    weekday: (day) => tOptions(`weekday.${day}`),
    otherDays: tSchedule("otherDays"),
    closed: tSchedule("closed"),
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-8 text-[#22262b]">
            {fullName}
          </h1>
          <p className="mt-1 text-sm text-[#676e78]">{t("role")}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-[#d4d8dd] bg-white px-[18px] py-2.5 text-[12.5px] font-medium text-[#22262b] hover:bg-[#f8f9fa]"
        >
          {t("editAvailability")}
        </button>
      </div>

      <section className="mt-6 max-w-[420px] rounded-2xl border border-[#e4e7ea] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-[#22262b]">
            {t("availabilityTitle")}
          </h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[12.5px] font-medium text-[#e86f22] hover:underline"
          >
            {t("edit")}
          </button>
        </div>
        <p className="mt-2 text-xs leading-[19px] text-[#676e78]">
          {t("weekly")}
        </p>
        <AcademicProfileAvailabilityView
          failed={Boolean(availability.error)}
          loading={availability.isLoading}
          rows={rows}
        />
      </section>

      {editing && (
        <OfficeHoursAvailabilityDialog onClose={() => setEditing(false)} />
      )}
    </>
  );
}
