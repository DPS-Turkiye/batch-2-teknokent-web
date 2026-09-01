"use client";

import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import {
  CALENDAR_FILTER_LABELS,
  CALENDAR_HOURS,
  CalendarFilter,
  useMentorCalendar,
} from "@/hooks/use-mentor-calendar";
import { Weekday, WEEKDAY_LABELS, WEEKDAY_ORDER } from "@/interfaces/mentor";
import { AppArea } from "@/types/app-area";

const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum"];
const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function hourOf(iso: string) {
  return new Date(iso).getHours();
}

function minuteLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sameDay(iso: string, day: Date) {
  const at = new Date(iso);
  return at.toDateString() === day.toDateString();
}

export default function MentorCalendarPage() {
  const calendar = useMentorCalendar();
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [draft, setDraft] = useState({
    dayOfWeek: Weekday.Tuesday,
    startTime: "14:00",
    endTime: "17:00",
    slotMinutes: 60,
  });

  const { weekStart, days } = calendar;
  const rangeEnd = days[days.length - 1];
  const range = `${weekStart.getDate()}–${rangeEnd.getDate()} ${MONTHS[rangeEnd.getMonth()]}`;

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
                        {DAY_LABELS[index]} {day.getDate()}
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
                            sameDay(item.scheduledAt, day) &&
                            hourOf(item.scheduledAt) === hour,
                        );
                        const slot = calendar.slots.find(
                          (item) =>
                            sameDay(item.startsAt, day) &&
                            hourOf(item.startsAt) === hour,
                        );
                        return (
                          <td
                            key={day.toISOString() + hour}
                            className="h-10 border border-[#f1f2f4] p-0.5 align-top"
                          >
                            {meeting ? (
                              <div className="h-full rounded bg-[#2f7ff0] px-1.5 py-1 text-[10px] leading-tight text-white">
                                <span className="block truncate font-semibold">
                                  {meeting.agenda || "Mentorluk görüşmesi"}
                                </span>
                                <span className="block truncate opacity-90">
                                  {minuteLabel(meeting.scheduledAt)}
                                </span>
                              </div>
                            ) : slot ? (
                              <div
                                className="h-full rounded bg-[#dbeafe]"
                                title="Müsait"
                              />
                            ) : null}
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
              onClick={() => setShowRuleForm((open) => !open)}
              className="w-full rounded-xl bg-[#e86f22] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#ce5e19]"
            >
              Yeni Müsaitlik Ekle
            </button>

            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
              <h2 className="text-sm font-bold text-[#22262b]">Müsaitliğim</h2>
              <p className="mt-1 text-xs text-[#858c96]">
                Tekrarlayan haftalık uygunluk
              </p>

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
    </AppShell>
  );
}
