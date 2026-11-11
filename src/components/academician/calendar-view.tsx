"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useLocale, useTranslations } from "next-intl";

import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import {
  EmptyLine,
  fieldClass,
  labelClass,
  WorkspaceList,
  WorkspaceRow,
  WorkspaceSection,
} from "@/components/academician/workspace-ui";
import { PageHeading, SolidButton } from "@/components/admin/admin-ui";
import { WeeklyAvailabilityEditor } from "@/components/availability/weekly-availability-editor";
import { useAcademicianCalendar } from "@/hooks/use-academician-calendar";
import { formatTimeRange } from "@/lib/utils";

export function AcademicianCalendarView() {
  const t = useTranslations("academicianWorkspace.calendar");
  const locale = useLocale();
  const calendar = useAcademicianCalendar();
  return (
    <div className="space-y-6">
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <SampleDataNotice />
      <WorkspaceQueryState
        isLoading={calendar.isLoading}
        error={calendar.error}
        onRetry={calendar.retry}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspaceSection
          title={t("weeklyTitle")}
          action={
            <SolidButton
              onClick={() => void calendar.weekly.save()}
              disabled={!calendar.weekly.draft || calendar.weekly.isSaving}
            >
              {calendar.weekly.isSaving ? t("saving") : t("save")}
            </SolidButton>
          }
        >
          <div className="rounded-3xl border border-[#e9ecef] bg-white px-6 py-5">
            <p className="mb-4 text-[12.5px] text-[#858c96]">
              {t("weeklyHint")}
            </p>
            <WeeklyAvailabilityEditor editor={calendar.weekly} />
          </div>
        </WorkspaceSection>

        <WorkspaceSection title={t("oneOffTitle")}>
          <p className="-mt-2 text-[12.5px] text-[#858c96]">
            {t("oneOffHint")}
          </p>
          {calendar.oneOffs.length ? (
            <WorkspaceList label={t("oneOffTitle")}>
              {calendar.oneOffs.map((oneOff, index) => {
                const when = formatTimeRange(
                  oneOff.startsAt,
                  oneOff.endsAt,
                  locale,
                );
                return (
                  <WorkspaceRow key={oneOff.id ?? oneOff.startsAt}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-[#22262b]">
                          {when}
                        </p>
                        <p className="mt-0.5 text-[12.5px] text-[#858c96]">
                          {oneOff.place ?? t("placeDefault")}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={t("remove", { when })}
                        disabled={calendar.isSaving}
                        onClick={() => calendar.removeOneOff(index)}
                        className="text-[12.5px] font-medium text-[#d9464b] disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  </WorkspaceRow>
                );
              })}
            </WorkspaceList>
          ) : (
            <EmptyLine text={t("oneOffEmpty")} />
          )}
          <form
            noValidate
            aria-label={t("oneOffTitle")}
            onSubmit={(event) => void calendar.addOneOff(event)}
            className="space-y-3 rounded-3xl border border-[#e9ecef] bg-white px-5 py-4"
          >
            <label className={`block ${labelClass}`}>
              {t("date")}
              <input
                type="date"
                value={calendar.oneOff.date}
                onChange={(event) =>
                  calendar.setOneOffField("date", event.target.value)
                }
                className={fieldClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`block ${labelClass}`}>
                {t("start")}
                <input
                  type="time"
                  step={900}
                  value={calendar.oneOff.start}
                  onChange={(event) =>
                    calendar.setOneOffField("start", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
              <label className={`block ${labelClass}`}>
                {t("end")}
                <input
                  type="time"
                  step={900}
                  value={calendar.oneOff.end}
                  onChange={(event) =>
                    calendar.setOneOffField("end", event.target.value)
                  }
                  className={fieldClass}
                />
              </label>
            </div>
            <label className={`block ${labelClass}`}>
              {t("place")}
              <input
                type="text"
                value={calendar.oneOff.place}
                onChange={(event) =>
                  calendar.setOneOffField("place", event.target.value)
                }
                className={fieldClass}
              />
            </label>
            {calendar.oneOffError ? (
              <p role="alert" className="text-[12px] text-[#d9464b]">
                {calendar.oneOffError}
              </p>
            ) : null}
            <SolidButton type="submit" disabled={calendar.isSaving}>
              {t("add")}
            </SolidButton>
          </form>
        </WorkspaceSection>
      </div>
    </div>
  );
}
