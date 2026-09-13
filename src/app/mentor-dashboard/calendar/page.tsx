"use client";

import { ChevronLeft, ChevronRight, FileText, X } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import {
  CreateMeetingDialog,
  type CreateMeetingBatch,
} from "@/components/mentor-dashboard/create-meeting-dialog";
import { RegularMentorshipWeekChecksPanel } from "@/components/mentor-dashboard/regular-mentorship-week-checks";
import { useAppSession } from "@/components/providers/session-provider";
import {
  CALENDAR_FILTER_LABELS,
  CALENDAR_HOURS,
  CalendarFilter,
  useMentorCalendar,
} from "@/hooks/use-mentor-calendar";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  hourOf,
  isSameDay,
  timeLabel,
  WEEKDAY_SHORT_LABELS,
  MENTOR_CALENDAR_FILTERS,
  weekRangeLabel,
} from "@/lib/calendar";
import {
  createGoogleMeetEvent,
  ensureGoogleCalendarToken,
} from "@/lib/google-calendar";
import { AppArea } from "@/types/app-area";

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function atHour(day: Date, hour: number) {
  const next = new Date(day);
  next.setHours(hour, 0, 0, 0);
  return next;
}

function counterpartOf(meeting: MeetingItem) {
  return meeting.organizationName ?? meeting.mentorName ?? "Mentorluk";
}

function MeetingModal({
  meeting,
  onClose,
  onDelete,
  isBusy,
}: {
  meeting: MeetingItem;
  onClose: () => void;
  onDelete: () => void;
  isBusy: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#22262b]/35 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-title"
    >
      <section className="w-full max-w-[560px] overflow-hidden rounded-[14px] bg-white shadow-[0_24px_60px_rgba(0,0,0,.22)]">
        <header className="relative border-b border-[#eef0f3] px-6 pb-4 pt-5">
          <p className="text-[11px] text-[#858c96]">{counterpartOf(meeting)}</p>
          <h2 id="meeting-title" className="mt-1 text-xl font-semibold">
            {meeting.agenda ?? "Mentorluk görüşmesi"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-5 top-8"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-[#eaf6ff] px-2.5 py-1 font-medium text-[#26a4ff]">
              {timeLabel(meeting.scheduledAt)}
              {meeting.durationMinutes
                ? ` · ${meeting.durationMinutes} dk`
                : ""}
            </span>
            {meeting.meetLink ? (
              <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[#676e78]">
                Online · Google Meet
              </span>
            ) : null}
          </div>
        </header>
        <div className="space-y-5 px-6 py-5 text-xs leading-5 text-[#4a5059]">
          {meeting.agenda ? (
            <section>
              <p className="mb-1 text-[10px] font-semibold uppercase text-[#858c96]">
                Toplantı amacı
              </p>
              <p>{meeting.agenda}</p>
            </section>
          ) : null}
          {meeting.notes ? (
            <section>
              <p className="mb-1 text-[10px] font-semibold uppercase text-[#858c96]">
                Notlar
              </p>
              <p>{meeting.notes}</p>
            </section>
          ) : null}
          {meeting.outcomes ? (
            <section>
              <p className="mb-1 text-[10px] font-semibold uppercase text-[#858c96]">
                Çıktılar
              </p>
              <p>{meeting.outcomes}</p>
            </section>
          ) : null}
          {!meeting.agenda && !meeting.notes && !meeting.outcomes ? (
            <p className="text-[#858c96]">
              Bu görüşme için henüz not eklenmedi.
            </p>
          ) : null}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-[#eef0f3] px-6 py-4">
          <button
            onClick={onDelete}
            disabled={isBusy}
            className="rounded-full border border-[#d4d8dd] px-5 py-2.5 text-[12.5px] disabled:opacity-50"
          >
            Görüşmeyi sil
          </button>
          {meeting.meetLink ? (
            <a
              href={meeting.meetLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#26a4ff] px-5 py-2.5 text-[12.5px] text-white"
            >
              Toplantıya katıl
            </a>
          ) : (
            <span className="text-[11px] text-[#858c96]">
              Toplantı bağlantısı yok
            </span>
          )}
        </footer>
      </section>
    </div>
  );
}

export default function MentorCalendarPage() {
  const calendar = useMentorCalendar();
  const session = useAppSession();
  const [openMeeting, setOpenMeeting] = useState<MeetingItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStartAt, setCreateStartAt] = useState<Date | null>(null);
  const [createError, setCreateError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const days = calendar.days;
  const range = days.length
    ? weekRangeLabel(days[0], days[days.length - 1])
    : "";
  const programEventCount =
    calendar.filter === CalendarFilter.Program ? calendar.programs.length : 0;

  function openCreateDialog(startAt: Date | null = null) {
    setCreateError(null);
    setCreateStartAt(startAt);
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setCreateStartAt(null);
    setCreateError(null);
  }

  async function submitMeeting(batch: CreateMeetingBatch) {
    setCreateError(null);
    setIsCreating(true);
    try {
      let meetLink = batch.meetLink;
      if (!meetLink) {
        const { token } = await ensureGoogleCalendarToken();
        meetLink = await createGoogleMeetEvent({
          accessToken: token,
          title: batch.agenda,
          startIso: batch.scheduledAt,
          durationMinutes: batch.durationMinutes,
        });
      }
      for (const recipient of batch.recipients) {
        await calendar.addMeeting({
          ...recipient,
          scheduledAt: batch.scheduledAt,
          durationMinutes: batch.durationMinutes,
          agenda: batch.agenda,
          meetLink,
          transcribeRequested: batch.transcribeRequested,
        });
      }
      closeCreateDialog();
    } catch (error) {
      setCreateError(
        error instanceof Error ? error : new Error("Toplantı oluşturulamadı."),
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <AppShell active={AppArea.Calendar} mentorHome>
      <main className="mx-auto w-full max-w-[1276px] px-6 pb-[72px] pt-3">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-semibold leading-[39px]">Takvim</h1>
            <p className="mt-1 text-[13px] text-[#676e78]">
              Bu hafta {calendar.meetings.length} görüşme ·{" "}
              {calendar.programs.length} program · {calendar.freeSlotCount} boş
              slot
            </p>
          </div>
          <button
            onClick={() => openCreateDialog(null)}
            className="rounded-full bg-[#26a4ff] px-4 py-2.5 text-[12.5px] font-medium text-white"
          >
            Yeni toplantı oluştur
          </button>
        </header>
        <div className="mt-[22px] flex gap-2">
          {MENTOR_CALENDAR_FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => calendar.setFilter(item)}
              className={`rounded-full border px-3 py-[5px] text-xs font-medium ${calendar.filter === item ? "border-[#f5faff] bg-[#f2f8fc] text-[#26a4ff]" : "border-[#e4e7ea] bg-[#f3f4f6] text-[#676e78]"}`}
            >
              {CALENDAR_FILTER_LABELS[item]}
            </button>
          ))}
        </div>
        <div className="mt-4 grid items-start gap-6 xl:grid-cols-[804px_400px]">
          <section className="overflow-x-auto rounded-xl border border-[#e4e7ea] bg-white px-5 pb-5 pt-[18px]">
            <div className="flex h-[38px] min-w-[720px] items-center justify-between">
              <h2 className="text-base font-semibold">{range}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={calendar.previousWeek}
                  aria-label="Önceki hafta"
                >
                  <ChevronLeft className="size-[18px]" strokeWidth={1.5} />
                </button>
                <button
                  onClick={calendar.thisWeek}
                  className="rounded-full border border-[#d4d8dd] px-4 py-2.5 text-[12.5px]"
                >
                  Bugün
                </button>
                <button onClick={calendar.nextWeek} aria-label="Sonraki hafta">
                  <ChevronRight className="size-[18px]" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            {calendar.isLoading ? (
              <p className="py-10 text-center text-xs text-[#858c96]">
                Yükleniyor...
              </p>
            ) : (
              <div className="mt-[14px] grid min-w-[720px] grid-cols-[52px_repeat(5,1fr)] text-[11px]">
                <div />
                {days.map((day, dayIndex) => (
                  <div
                    key={day.toISOString()}
                    className="flex h-[34px] items-center justify-center gap-1.5"
                  >
                    <span className="text-[#676e78]">
                      {WEEKDAY_SHORT_LABELS[dayIndex]}
                    </span>
                    <b className="text-[13px] font-medium">{day.getDate()}</b>
                  </div>
                ))}
                {CALENDAR_HOURS.map((hour) => (
                  <div className="contents" key={hour}>
                    <div className="pr-2 text-right text-[#858c96]">
                      {`${String(hour).padStart(2, "0")}:00`}
                    </div>
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
                      const slotStart = slot
                        ? new Date(slot.startsAt)
                        : atHour(day, hour);
                      const createLabel = `${day.getDate()} ${String(hour).padStart(2, "0")}:00 için toplantı oluştur`;
                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className="relative h-[42px] border-l border-t border-[#eef0f3]"
                        >
                          {meeting ? (
                            <button
                              type="button"
                              onClick={() => setOpenMeeting(meeting)}
                              className="absolute inset-x-1 top-px z-10 h-10 overflow-hidden rounded-md bg-[#26a4ff] px-2 py-1.5 text-left leading-[15px] text-white"
                            >
                              <b className="block truncate text-[11px] font-semibold">
                                {counterpartOf(meeting)}
                              </b>
                              {meeting.agenda ? (
                                <span className="block truncate text-[10.5px] opacity-80">
                                  {meeting.agenda}
                                </span>
                              ) : null}
                            </button>
                          ) : slot ? (
                            <button
                              type="button"
                              onClick={() => openCreateDialog(slotStart)}
                              aria-label={createLabel}
                              className="absolute inset-x-1 top-px z-10 block h-10 overflow-hidden rounded-md bg-[#e9f2fa] px-2 py-1.5 text-left leading-[15px] text-[#26a4ff] hover:bg-[#dceefb]"
                            >
                              <b className="block text-[11px] font-semibold">
                                Müsait
                              </b>
                              <span className="block text-[10.5px] opacity-80">
                                {slot.durationMinutes} dk
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openCreateDialog(slotStart)}
                              aria-label={createLabel}
                              className="absolute inset-0 z-0 hover:bg-[#f8fafc]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
            {calendar.filter === CalendarFilter.Program ? (
              <p className="mt-4 min-w-[720px] text-xs text-[#676e78]">
                {programEventCount === 0
                  ? "Katıldığınız bir program yok."
                  : `${programEventCount} programa katılıyorsunuz: ${calendar.programs
                      .map((program) => program.name)
                      .join(", ")}`}
              </p>
            ) : null}
          </section>
          <aside className="space-y-4">
            <RegularMentorshipWeekChecksPanel
              weekStart={toDateKey(days[0] ?? new Date())}
            />
            <section className="rounded-xl border border-[#e4e7ea] p-[18px]">
              <div className="flex justify-between">
                <h2 className="text-[15px] font-semibold">Müsaitliğim</h2>
                <a
                  href="/mentor-profile"
                  className="text-[12.5px] font-medium text-[#26a4ff]"
                >
                  Düzenle
                </a>
              </div>
              <p className="mt-3 text-xs text-[#676e78]">
                Tekrarlayan haftalık uygunluk
              </p>
              <div className="mt-4 space-y-3">
                {calendar.rules.length === 0 ? (
                  <p className="text-xs text-[#858c96]">
                    Tanımlı bir uygunluk kuralı yok.
                  </p>
                ) : (
                  calendar.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex justify-between text-[12.5px]"
                    >
                      <span className="text-[#4a5059]">{rule.dayOfWeek}</span>
                      <span className="font-medium">
                        {rule.startTime}–{rule.endTime}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex justify-between rounded-lg bg-[#f2f8fc] px-3 py-2.5 text-xs">
                <span className="text-[#676e78]">Bu hafta</span>
                <b className="font-medium text-[#26a4ff]">
                  {calendar.freeSlotCount} boş slot
                </b>
              </div>
            </section>
            <section className="rounded-xl border border-[#e4e7ea] p-[18px]">
              <h2 className="text-[15px] font-semibold">Sıradaki görüşmeler</h2>
              <div className="mt-3 space-y-3">
                {calendar.meetings.length === 0 ? (
                  <p className="text-xs text-[#858c96]">
                    Bu hafta planlanmış görüşme yok.
                  </p>
                ) : (
                  [...calendar.meetings]
                    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                    .map((meeting) => (
                      <button
                        onClick={() => setOpenMeeting(meeting)}
                        key={meeting.id}
                        className="flex w-full items-center justify-between rounded-lg border border-[#e4e7ea] px-3 py-2.5 text-left"
                      >
                        <span>
                          <b className="block text-[13px] font-medium">
                            {meeting.agenda ?? "Mentorluk görüşmesi"}
                          </b>
                          <span className="block text-[11.5px] text-[#676e78]">
                            {counterpartOf(meeting)}
                          </span>
                        </span>
                        <span className="text-[11.5px] font-medium text-[#26a4ff]">
                          {timeLabel(meeting.scheduledAt)}
                        </span>
                      </button>
                    ))
                )}
              </div>
            </section>
            <section className="rounded-xl border border-[#e4e7ea] p-[18px]">
              <h2 className="text-[15px] font-semibold">Dosyalar</h2>
              <p className="mt-3 flex items-center gap-2 text-xs text-[#676e78]">
                <FileText className="size-4" strokeWidth={1.5} />
                Görüşme dosyaları mentorluk çalışma alanında.
              </p>
            </section>
          </aside>
        </div>
      </main>
      {openMeeting ? (
        <MeetingModal
          meeting={openMeeting}
          isBusy={calendar.isSavingMeeting}
          onClose={() => setOpenMeeting(null)}
          onDelete={async () => {
            await calendar.removeMeeting(openMeeting.id);
            setOpenMeeting(null);
          }}
        />
      ) : null}
      {createOpen ? (
        <CreateMeetingDialog
          mentorName={session?.fullName ?? ""}
          mentorships={calendar.mentorships}
          programs={calendar.programs}
          regularMentorships={calendar.regularMentorships}
          startAt={createStartAt}
          isSaving={isCreating || calendar.isSavingMeeting}
          error={createError ?? calendar.meetingError}
          onClose={closeCreateDialog}
          onSubmit={submitMeeting}
        />
      ) : null}
    </AppShell>
  );
}
