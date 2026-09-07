"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { CalendarImportModal } from "@/components/calendar/calendar-import-modal";
import { FilterPills } from "@/components/calendar/filter-pills";
import { MonthGrid } from "@/components/calendar/month-grid";
import { SyncMeetingActions } from "@/components/calendar/sync-meeting-actions";
import { WeekGridTable } from "@/components/calendar/week-grid-table";
import { useCalendarImport } from "@/hooks/use-calendar-import";
import { useMenteeCalendar } from "@/hooks/use-mentee-calendar";
import type { MeetingItem } from "@/interfaces/meeting";
import { AppArea } from "@/types/app-area";
import {
  CalendarFilter,
  DAY_SHORT_LABELS,
  hourOf,
  isSameDay,
  timeLabel,
} from "@/lib/calendar";
import { relayGoogleOAuthTokenFromUrl } from "@/lib/google-calendar";

/**
 * The mentee calendar, rebuilt on the shared week/month primitives the mentor
 * calendar also uses — same filter row, same hourly grid chrome, same month
 * grid — instead of the older, visually unrelated implementation this
 * replaced (7 days/9–21h and no availability panel, per the design; no
 * meeting-creation dialog, because none exists for the mentee today).
 */
export function CalendarView() {
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
    <AppShell active={AppArea.Calendar} title="Takvimim">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#22262b]">Takvimim</h1>
            <p className="mt-1 text-sm text-[#676e78]">
              Görüşmelerini ve etkinliklerini takip et.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="rounded-xl border border-[#e4e7ea] bg-white px-4 py-2.5 text-xs font-semibold text-[#22262b] transition hover:bg-[#f8f9fa]"
          >
            Google Takvimden Aktar
          </button>
        </div>

        <div className="mt-4">
          <FilterPills filter={calendar.filter} onChange={calendar.setFilter} />
        </div>

        <section className="mt-5 rounded-2xl border border-[#e4e7ea] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[#22262b]">
              {calendar.rangeLabel}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={calendar.previous}
                  className="rounded-lg border border-[#e4e7ea] px-3 py-1.5 text-xs font-medium"
                >
                  ← Önceki
                </button>
                <button
                  type="button"
                  onClick={calendar.today}
                  className="rounded-lg border border-[#e4e7ea] px-3 py-1.5 text-xs font-medium"
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={calendar.next}
                  className="rounded-lg border border-[#e4e7ea] px-3 py-1.5 text-xs font-medium"
                >
                  Sonraki →
                </button>
              </div>
              <div className="flex rounded-lg bg-[#f1f2f4] p-1">
                {(["WEEK", "MONTH"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => calendar.setViewMode(mode)}
                    aria-pressed={calendar.viewMode === mode}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      calendar.viewMode === mode
                        ? "bg-white text-[#22262b] shadow-sm"
                        : "text-[#858c96] hover:text-[#22262b]"
                    }`}
                  >
                    {mode === "WEEK" ? "Hafta" : "Ay"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {calendar.loadError ? (
            <p className="mt-4 rounded-xl border border-[#f4c6a7] bg-[#fdebdd] p-4 text-xs text-[#b94f12]">
              Takvim yüklenemedi: {calendar.loadError.message}
            </p>
          ) : calendar.isLoading ? (
            <p className="mt-4 text-center text-xs text-[#676e78]">
              Takvim yükleniyor…
            </p>
          ) : calendar.filter === CalendarFilter.Program ? (
            <p className="mt-4 rounded-xl bg-[#f1f2f4] p-4 text-center text-xs text-[#676e78]">
              Program etkinlikleri henüz tanımlı değil.
            </p>
          ) : calendar.viewMode === "WEEK" ? (
            <WeekGridTable
              days={calendar.days}
              hours={calendar.hours}
              dayLabels={DAY_SHORT_LABELS}
              renderCell={(day, hour) => {
                const meeting = calendar.meetings.find(
                  (item) =>
                    isSameDay(item.scheduledAt, day) &&
                    hourOf(item.scheduledAt) === hour,
                );
                if (!meeting) return null;
                return (
                  <button
                    type="button"
                    onClick={() => setSelectedMeeting(meeting)}
                    aria-label={`${meeting.agenda ?? "Toplantı"} detayını aç`}
                    className="flex min-h-[3.25rem] w-fit min-w-[6.5rem] max-w-[9.5rem] flex-col justify-center rounded-lg bg-[#e86f22] px-2 py-1.5 text-left text-[11px] leading-snug text-white shadow-[0_1px_2px_rgba(15,23,42,.12)] hover:bg-[#ce5e19]"
                  >
                    <span className="line-clamp-2 font-semibold">
                      {meeting.agenda ?? "Toplantı"}
                    </span>
                    <span className="mt-0.5 truncate text-[10px] opacity-90">
                      {timeLabel(meeting.scheduledAt)}
                    </span>
                  </button>
                );
              }}
            />
          ) : (
            <div className="mt-4">
              <MonthGrid
                monthDate={calendar.monthDate}
                meetings={calendar.meetings}
                onSelectMeeting={setSelectedMeeting}
              />
            </div>
          )}
        </section>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between border-b border-[#f1f2f4] pb-4">
              <h3 className="text-xl font-bold text-[#22262b]">
                {selectedMeeting.agenda ?? "Toplantı"}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                aria-label="Kapat"
                className="text-[#a4aab2] hover:text-[#676e78]"
              >
                ✕
              </button>
            </div>

            <div className="my-6 space-y-4 text-xs text-[#676e78]">
              <div className="rounded-xl bg-[#f8f9fa] p-4 space-y-2">
                <p>
                  <strong className="text-[#22262b]">Zaman:</strong>{" "}
                  {new Intl.DateTimeFormat("tr-TR", {
                    dateStyle: "full",
                    timeStyle: "short",
                  }).format(new Date(selectedMeeting.scheduledAt))}
                </p>
                <p>
                  <strong className="text-[#22262b]">Süre:</strong>{" "}
                  {selectedMeeting.durationMinutes} dakika
                </p>
              </div>

              {selectedMeeting.meetLink ? (
                <a
                  href={selectedMeeting.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate rounded-lg border border-[#e4e7ea] bg-[#f8f9fa] p-2.5 font-mono text-xs text-[#2f7ff0] underline"
                >
                  {selectedMeeting.meetLink}
                </a>
              ) : (
                <p>Bu toplantı için henüz bir görüşme bağlantısı yok.</p>
              )}

              <SyncMeetingActions meeting={selectedMeeting} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f2f4] pt-4">
              <Link
                href="/meetings/research/prepare"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#e86f22] px-4 text-xs font-bold text-white transition hover:bg-[#c85816]"
              >
                <ClipboardList className="size-4" aria-hidden />
                Toplantıya hazırlan
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
