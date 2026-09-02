"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import {
  CreateMeetingDialog,
  type CreateMeetingBatch,
} from "@/components/mentor-dashboard/create-meeting-dialog";
import { MeetingDetailDialog } from "@/components/mentor-dashboard/meeting-detail-dialog";
import { useSession } from "@/components/providers/session-provider";
import {
  CALENDAR_FILTER_LABELS,
  CALENDAR_HOURS,
  CalendarFilter,
  useMentorCalendar,
} from "@/hooks/use-mentor-calendar";
import type { MeetingItem } from "@/interfaces/meeting";
import { Weekday, WEEKDAY_LABELS, WEEKDAY_ORDER } from "@/interfaces/mentor";
import {
  hourOf,
  isSameDay,
  timeLabel,
  weekRangeLabel,
  WEEKDAY_SHORT_LABELS,
} from "@/lib/calendar";
import {
  createGoogleMeetEvent,
  ensureGoogleCalendarToken,
  relayGoogleOAuthTokenFromUrl,
} from "@/lib/google-calendar";
import { meetingCalendarTitle } from "@/lib/meeting-participants";
import { AppArea } from "@/types/app-area";

export default function MentorCalendarPage() {
  const calendar = useMentorCalendar();
  const { session } = useSession();
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [meetingAt, setMeetingAt] = useState<Date | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState<MeetingItem | null>(null);
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [meetError, setMeetError] = useState<Error | null>(null);
  const [draft, setDraft] = useState({
    dayOfWeek: Weekday.Tuesday,
    startTime: "14:00",
    endTime: "17:00",
    slotMinutes: 60,
  });

  const { weekStart, days } = calendar;
  const rangeEnd = days[days.length - 1];
  const range = weekRangeLabel(weekStart, rangeEnd);

  useEffect(() => {
    relayGoogleOAuthTokenFromUrl();
  }, []);

  function openMeeting(at: Date | null) {
    setMeetingAt(at);
    setMeetError(null);
    setMeetingOpen(true);
  }

  async function submitMeeting(input: CreateMeetingBatch) {
    setMeetError(null);
    setCreatingMeet(true);
    try {
      let meetLink = input.meetLink;
      if (!meetLink) {
        const { token } = await ensureGoogleCalendarToken();
        meetLink = await createGoogleMeetEvent({
          accessToken: token,
          title: input.agenda,
          startIso: input.scheduledAt,
          durationMinutes: input.durationMinutes,
        });
      }
      for (const recipient of input.recipients) {
        await calendar.addMeeting({
          ...recipient,
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          agenda: input.agenda,
          meetLink,
          transcribeRequested: input.transcribeRequested ?? false,
        });
      }
      setMeetingOpen(false);
    } catch (reason) {
      setMeetError(
        reason instanceof Error
          ? reason
          : new Error("Google Meet oluşturulamadı."),
      );
    } finally {
      setCreatingMeet(false);
    }
  }

  async function submitRule() {
    await calendar.addRule(draft);
    setShowRuleForm(false);
  }

  return (
    <AppShell active={AppArea.Calendar} title="Takvim">
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-8 sm:px-8">
        <h1 className="text-2xl font-bold text-[#22262b]">Takvim</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {Object.values(CalendarFilter).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => calendar.setFilter(option)}
              aria-pressed={calendar.filter === option}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                calendar.filter === option
                  ? "bg-[#e86f22] text-white"
                  : "bg-[#fdebdd] text-[#b94f12] hover:bg-[#f8d5bd]"
              }`}
            >
              {CALENDAR_FILTER_LABELS[option]}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-[#e4e7ea] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#22262b]">{range}</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={calendar.previousWeek}
                  className="rounded-lg border border-[#e4e7ea] px-3 py-1.5 text-xs font-medium"
                >
                  ← Önceki
                </button>
                <button
                  type="button"
                  onClick={calendar.thisWeek}
                  className="rounded-lg border border-[#e4e7ea] px-3 py-1.5 text-xs font-medium"
                >
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={calendar.nextWeek}
                  className="rounded-lg border border-[#e4e7ea] px-3 py-1.5 text-xs font-medium"
                >
                  Sonraki →
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="w-14" />
                    {days.map((day, index) => (
                      <th
                        key={day.toISOString()}
                        scope="col"
                        className="border-b border-[#e4e7ea] pb-2 font-medium text-[#676e78]"
                      >
                        {WEEKDAY_SHORT_LABELS[index]} {day.getDate()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CALENDAR_HOURS.map((hour) => (
                    <tr key={hour}>
                      <th
                        scope="row"
                        className="pr-2 text-right align-top font-normal text-[#a4aab2]"
                      >
                        {String(hour).padStart(2, "0")}:00
                      </th>
                      {days.map((day) => {
                        const meeting = calendar.meetings.find(
                          (item) =>
                            isSameDay(item.scheduledAt, day) &&
                            hourOf(item.scheduledAt) === hour,
                        );
                        const slot = calendar.slots.find(
                          (item) =>
                            isSameDay(item.startsAt, day) &&
                            hourOf(item.startsAt) === hour,
                        );
                        return (
                          <td
                            key={day.toISOString() + hour}
                            className="h-[4.25rem] w-[18%] border border-[#f1f2f4] p-1 align-top"
                          >
                            {meeting ? (
                              <button
                                type="button"
                                onClick={() => setDetailMeeting(meeting)}
                                aria-label={`${meetingCalendarTitle(meeting)} detayını aç`}
                                className="flex min-h-[3.25rem] w-fit min-w-[6.5rem] max-w-[9.5rem] flex-col justify-center rounded-lg bg-[#2f7ff0] px-2 py-1.5 text-left text-[11px] leading-snug text-white shadow-[0_1px_2px_rgba(15,23,42,.12)] hover:bg-[#1f6fe0]"
                              >
                                <span className="line-clamp-2 font-semibold">
                                  {meetingCalendarTitle(meeting)}
                                </span>
                                <span className="mt-0.5 truncate text-[10px] opacity-90">
                                  {timeLabel(meeting.scheduledAt)}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const at = new Date(day);
                                  at.setHours(hour, 0, 0, 0);
                                  openMeeting(at);
                                }}
                                aria-label={`${day.getDate()} ${String(hour).padStart(2, "0")}:00 için toplantı oluştur`}
                                title={slot ? "Müsait" : undefined}
                                className={`h-full w-full rounded-lg ${
                                  slot
                                    ? "bg-[#dbeafe] hover:bg-[#bfdbfe]"
                                    : "hover:bg-[#f8f9fa]"
                                }`}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {calendar.filter === CalendarFilter.Program ? (
              <p className="mt-4 rounded-xl bg-[#f1f2f4] p-4 text-center text-xs text-[#676e78]">
                Program etkinlikleri henüz tanımlı değil.
              </p>
            ) : null}
          </section>

          <aside className="space-y-4">
            <button
              type="button"
              onClick={() => openMeeting(null)}
              className="w-full rounded-xl bg-[#e86f22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ce5e19]"
            >
              Yeni Toplantı Oluştur
            </button>

            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[#22262b]">
                    Müsaitliğim
                  </h2>
                  <p className="mt-1 text-xs text-[#858c96]">
                    Tekrarlayan haftalık uygunluk
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRuleForm((open) => !open)}
                  className="rounded-lg border border-[#e4e7ea] px-3 py-1.5 text-xs font-medium text-[#676e78]"
                >
                  Düzenle
                </button>
              </div>

              {calendar.rules.length === 0 ? (
                <p className="mt-4 text-xs text-[#676e78]">
                  Henüz tekrarlayan bir uygunluk eklemediniz.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {calendar.rules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-[#22262b]">
                        {WEEKDAY_LABELS[rule.dayOfWeek]}
                      </span>
                      <span className="text-[#676e78]">
                        {rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)}
                      </span>
                      <button
                        type="button"
                        onClick={() => calendar.removeRule(rule.id)}
                        className="text-xs font-semibold text-[#b42318] hover:underline"
                      >
                        Kaldır
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 border-t border-[#f1f2f4] pt-3 text-xs text-[#676e78]">
                Bu hafta kapasite{" "}
                <span className="font-semibold text-[#1f9d55]">
                  {calendar.freeSlotCount} boş slot
                </span>
              </p>

              {calendar.ruleError ? (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-[#fdeaea] px-3 py-2 text-xs text-[#b42318]"
                >
                  {calendar.ruleError.message}
                </p>
              ) : null}

              {showRuleForm ? (
                <div className="mt-4 space-y-3 border-t border-[#f1f2f4] pt-4">
                  <label className="block text-xs font-medium text-[#676e78]">
                    Gün
                    <select
                      value={draft.dayOfWeek}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          dayOfWeek: event.target.value as Weekday,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-2 py-1.5 text-sm text-[#22262b]"
                    >
                      {WEEKDAY_ORDER.map((day) => (
                        <option key={day} value={day}>
                          {WEEKDAY_LABELS[day]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <label className="flex-1 text-xs font-medium text-[#676e78]">
                      Başlangıç
                      <input
                        type="time"
                        value={draft.startTime}
                        onChange={(event) =>
                          setDraft({ ...draft, startTime: event.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="flex-1 text-xs font-medium text-[#676e78]">
                      Bitiş
                      <input
                        type="time"
                        value={draft.endTime}
                        onChange={(event) =>
                          setDraft({ ...draft, endTime: event.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-[#e4e7ea] px-2 py-1.5 text-sm"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={submitRule}
                    disabled={calendar.isSavingRule}
                    className="w-full rounded-lg bg-[#e86f22] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {calendar.isSavingRule ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </div>

      {meetingOpen ? (
        <CreateMeetingDialog
          mentorName={session?.fullName ?? ""}
          mentorships={calendar.mentorships}
          programs={calendar.programs}
          startAt={meetingAt}
          isSaving={calendar.isSavingMeeting || creatingMeet}
          error={meetError ?? calendar.meetingError}
          onClose={() => setMeetingOpen(false)}
          onSubmit={submitMeeting}
        />
      ) : null}

      {detailMeeting ? (
        <MeetingDetailDialog
          meeting={detailMeeting}
          mentorships={calendar.mentorships}
          programs={calendar.programs}
          onClose={() => setDetailMeeting(null)}
        />
      ) : null}
    </AppShell>
  );
}
