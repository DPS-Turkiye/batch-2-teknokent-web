"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CalendarImportModal } from "@/components/calendar/calendar-import-modal";
import { FilterPills } from "@/components/calendar/filter-pills";
import { MeetingDetailModal } from "@/components/calendar/meeting-detail-modal";
import {
  PrepCard,
  UpcomingCard,
} from "@/components/calendar/mentee-calendar-sidebar";
import { MenteeWeekGrid } from "@/components/calendar/mentee-week-grid";
import { AppShell } from "@/components/hoc/app-shell";
import { useCalendarImport } from "@/hooks/use-calendar-import";
import { useMenteeCalendar } from "@/hooks/use-mentee-calendar";
import type { MeetingItem } from "@/interfaces/meeting";
import { CalendarFilter, MENTEE_CALENDAR_FILTERS } from "@/lib/calendar";
import { relayGoogleOAuthTokenFromUrl } from "@/lib/google-calendar";
import { AppArea } from "@/types/app-area";

const pillButton =
  "rounded-full border border-[#d4d8dd] bg-white px-4 py-2.5 text-[12.5px] font-medium leading-[18px] text-[#4a5059] transition hover:bg-[#f8f9fa]";
const chevronButton =
  "grid size-8 place-items-center rounded-full transition hover:bg-[#f8f9fa]";

export function CalendarView() {
  const t = useTranslations("calendar");
  const importState = useCalendarImport();
  const calendar = useMenteeCalendar(importState.importedMeetings);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(
    null,
  );

  useEffect(() => {
    relayGoogleOAuthTokenFromUrl();
  }, []);

  return (
    <AppShell active={AppArea.Calendar} menteeHome>
      <div className="mx-auto w-full max-w-[1228px] space-y-[22px] px-4 pb-[72px] pt-3 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-[28px] font-semibold leading-[39px] text-[#22262b]">
              {t("title")}
            </h1>
            <p className="text-[13px] leading-[18px] text-[#676e78]">
              {calendar.summary}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className={pillButton}
            >
              {t("importGoogle")}
            </button>
            <Link
              href="/mentor-request"
              className="rounded-full bg-[#e86f22] px-4 py-2.5 text-[12.5px] font-medium leading-[18px] text-white transition hover:bg-[#ce5e19]"
            >
              {t("requestMeeting")}
            </Link>
          </div>
        </header>

        <FilterPills
          filter={calendar.filter}
          options={MENTEE_CALENDAR_FILTERS}
          onChange={calendar.setFilter}
        />

        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <section
            aria-labelledby="calendar-week"
            className="w-full min-w-0 flex-1 space-y-3.5 rounded-[24px] border border-[#e4e7ea] bg-white px-5 pb-5 pt-[18px]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="calendar-week"
                className="text-base font-semibold leading-[22px] text-[#22262b]"
              >
                {calendar.rangeLabel}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={calendar.previous}
                  aria-label={t("previousWeek")}
                  className={chevronButton}
                >
                  <Image
                    src="/calendar/expand-right-light.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="size-[18px] rotate-180"
                  />
                </button>
                <button
                  type="button"
                  onClick={calendar.today}
                  className={pillButton}
                >
                  {t("today")}
                </button>
                <button
                  type="button"
                  onClick={calendar.next}
                  aria-label={t("nextWeek")}
                  className={chevronButton}
                >
                  <Image
                    src="/calendar/expand-right-light.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="size-[18px]"
                  />
                </button>
              </div>
            </div>

            {calendar.loadError ? (
              <p
                role="alert"
                className="rounded-xl border border-[#f4c6a7] bg-[#fdebdd] p-4 text-xs text-[#b94f12]"
              >
                {t("loadFailed", { error: calendar.loadError.message })}
              </p>
            ) : calendar.isLoading ? (
              <p className="py-10 text-center text-xs text-[#676e78]">
                {t("loading")}
              </p>
            ) : calendar.filter === CalendarFilter.Program ? (
              <p className="rounded-xl bg-[#f3f4f6] p-4 text-center text-xs text-[#676e78]">
                {t("noProgram")}
              </p>
            ) : (
              <MenteeWeekGrid
                days={calendar.days}
                hours={calendar.hours}
                entriesByDay={calendar.entriesByDay}
                today={calendar.now}
                onSelectMeeting={setSelectedMeeting}
              />
            )}
          </section>

          <aside className="w-full space-y-4 lg:w-[400px] lg:shrink-0">
            {calendar.prep ? (
              <PrepCard
                meeting={calendar.prep.meeting}
                items={calendar.prep.items}
                now={calendar.now}
                isLoading={calendar.sidebarLoading}
              />
            ) : null}
            <UpcomingCard
              entries={calendar.upcoming}
              isLoading={calendar.sidebarLoading}
              hasError={calendar.sidebarError}
            />
          </aside>
        </div>
      </div>

      {showImportModal ? (
        <CalendarImportModal
          importing={importState.importing}
          error={importState.error}
          successMessage={importState.successMessage}
          onSyncWithGoogle={importState.syncWithGoogle}
          onImportFile={importState.importFile}
          onClose={() => setShowImportModal(false)}
        />
      ) : null}

      {selectedMeeting ? (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      ) : null}
    </AppShell>
  );
}
