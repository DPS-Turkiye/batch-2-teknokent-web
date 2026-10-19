"use client";

import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import {
  Avatar,
  EmptyNote,
  QueryNotice,
  SolidButton,
} from "@/components/admin/admin-ui";
import { ProposeMeetingDialog } from "@/components/propose-meeting-dialog";
import { PillSelect } from "@/components/coordinator/pill-select";
import { useCoordinatorCalendar } from "@/hooks/use-coordinator-calendar";
import { useMentorshipMeetingProposals } from "@/hooks/use-meeting-proposals";
import type {
  CoordinatorCalendar,
  CoordinatorCalendarItem,
} from "@/interfaces/coordinator-calendar";
import { CoordinatorAgendaKind } from "@/interfaces/coordinator-overview";
import {
  type CoordinatorProgram,
  ProgramEventKind,
} from "@/interfaces/coordinator-program";
import {
  type CalendarTexts,
  CalendarView,
  conflictSummary,
  type EventDraft,
  fullRecordingCount,
  GRID_HOURS,
  GRID_START_HOUR,
  itemsOnDay,
  isRecordingFull,
  longDayLabel,
  mentorshipHref,
  placeDayItems,
  recordingNote,
  sameDay,
  slotLabel,
  timeLabel,
  weekdayLabel,
} from "@/lib/coordinator-calendar";
import { coordinatorMessageHref } from "@/lib/coordinator-mentorships";
import { initials } from "@/lib/utils";

const ROW = 56;

function useCalendarTexts(): CalendarTexts {
  return { t: useTranslations("coordinatorCalendar"), locale: useLocale() };
}

export function CoordinatorCalendarView() {
  const { t } = useCalendarTexts();
  const calendar = useCoordinatorCalendar();
  const data = calendar.query.data;
  const selected =
    calendar.items.find((item) => item.id === calendar.selectedId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconButton label={t("previous")} onClick={calendar.previous}>
            <ChevronLeft aria-hidden className="size-4" />
          </IconButton>
          <h1 className="min-w-[180px] text-center text-[17px] font-semibold text-[#22262b]">
            {calendar.label}
          </h1>
          <IconButton label={t("next")} onClick={calendar.next}>
            <ChevronRight aria-hidden className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={calendar.goToToday}
            className="rounded-full bg-[#f4f5f7] px-3 py-1.5 text-[12.5px] text-[#22262b]"
          >
            {t("today")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={t("viewGroup")}
            className="flex gap-1 rounded-full bg-[#f4f5f7] p-1"
          >
            {Object.values(CalendarView).map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={calendar.view === view}
                onClick={() => calendar.setView(view)}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] ${
                  calendar.view === view
                    ? "bg-white font-medium text-[#22262b] shadow-[0_1px_2px_rgba(33,38,43,0.08)]"
                    : "text-[#858c96]"
                }`}
              >
                {t(`views.${view}`)}
              </button>
            ))}
          </div>
          <PillSelect
            label={t("program")}
            value={calendar.programId ?? ""}
            onChange={(value) => calendar.setProgramId(value || null)}
            options={[
              { value: "", label: t("allPrograms") },
              ...calendar.programOptions.map((program) => ({
                value: program.id,
                label: program.name,
              })),
            ]}
          />
          <SolidButton onClick={calendar.openEventForm}>
            {t("addEvent")}
          </SolidButton>
        </div>
      </div>

      <Legend />
      <QueryNotice
        isLoading={calendar.query.isLoading}
        error={calendar.query.error}
      />

      {data ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {calendar.view === CalendarView.Week ? (
              <WeekGrid
                days={calendar.days}
                items={calendar.items}
                selected={selected}
                capacity={data.recordingCapacity}
                onSelect={calendar.select}
              />
            ) : calendar.view === CalendarView.Month ? (
              <MonthGrid
                days={calendar.days}
                month={calendar.days[10].getMonth()}
                items={calendar.items}
                onSelect={calendar.select}
              />
            ) : (
              <ListView
                days={calendar.days}
                items={calendar.items}
                capacity={data.recordingCapacity}
                onSelect={calendar.select}
              />
            )}
          </div>
          <aside className="space-y-4">
            {selected && calendar.view !== CalendarView.Week ? (
              <ItemCard
                item={selected}
                capacity={data.recordingCapacity}
                onClose={() => calendar.select(null)}
              />
            ) : null}
            <RecordingCapacity data={data} />
            <Conflicts data={data} onReschedule={calendar.startReschedule} />
            <Summary
              data={data}
              period={
                calendar.view === CalendarView.Month
                  ? t("thisMonth")
                  : t("thisWeek")
              }
              onOpenList={() => calendar.setView(CalendarView.List)}
              showListLink={calendar.view !== CalendarView.List}
            />
          </aside>
        </div>
      ) : null}

      {calendar.rescheduling?.mentorshipId ? (
        <RescheduleDialog
          meeting={calendar.rescheduling}
          mentorshipId={calendar.rescheduling.mentorshipId}
          onDone={calendar.endReschedule}
        />
      ) : null}
      {calendar.draft ? (
        <EventForm
          draft={calendar.draft}
          programs={calendar.programOptions}
          error={calendar.draftError}
          saving={calendar.saving}
          onChange={calendar.updateDraft}
          onSave={calendar.saveDraft}
          onClose={calendar.closeEventForm}
        />
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full border border-[#e9ecef] bg-white text-[#676e78]"
    >
      {children}
    </button>
  );
}

function MeetingDots() {
  return (
    <span aria-hidden className="flex shrink-0 -space-x-0.5">
      <span className="size-2 rounded-full bg-[#26a4ff]" />
      <span className="size-2 rounded-full bg-[#f97316]" />
    </span>
  );
}

function KindDot({ item }: { item: CoordinatorCalendarItem }) {
  if (item.kind === CoordinatorAgendaKind.Meeting) return <MeetingDots />;
  return (
    <span
      aria-hidden
      className={`size-2 shrink-0 rounded-full ${
        item.kind === CoordinatorAgendaKind.Deadline
          ? "bg-[#b7791f]"
          : "bg-[#22262b]"
      }`}
    />
  );
}

function Legend() {
  const { t } = useCalendarTexts();
  return (
    <ul className="flex flex-wrap justify-end gap-4 text-[12.5px] text-[#676e78]">
      <li className="flex items-center gap-1.5">
        <MeetingDots /> {t("meetingKind")}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#22262b]" /> {t("eventKind")}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#b7791f]" />{" "}
        {t("deadlineKind")}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[#d9464b]" /> {t("conflict")}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-2.5 w-3.5 rounded-[3px] border border-dashed border-[#26a4ff]" />{" "}
        {t("proposedSlot")}
      </li>
    </ul>
  );
}

function itemTone(item: CoordinatorCalendarItem) {
  if (item.proposalId) {
    return "border-dashed border-[#26a4ff] bg-[#eef7ff] text-[#1a7fcc]";
  }
  if (item.conflict) return "border-[#d9464b] bg-[#fdeeee] text-[#d9464b]";
  if (item.kind === CoordinatorAgendaKind.Event) {
    return "border-[#22262b] bg-[#22262b] text-white";
  }
  if (item.kind === CoordinatorAgendaKind.Deadline) {
    return "border-[#fff1d6] bg-[#fff6e5] text-[#b7791f]";
  }
  return "border-[#e9ecef] bg-white text-[#22262b]";
}

function itemName(item: CoordinatorCalendarItem, t: CalendarTexts["t"]) {
  if (item.kind !== CoordinatorAgendaKind.Meeting) return item.title;
  return `${item.mentorName ?? t("mentorFallback")} ↔ ${item.organizationName ?? t("teamFallback")}`;
}

function itemDetail(
  item: CoordinatorCalendarItem,
  { t, locale }: CalendarTexts,
) {
  const time = timeLabel(item.startsAt, locale);
  if (item.proposalId) return `${time} · ${t("proposedSlot")}`;
  if (item.kind === CoordinatorAgendaKind.Meeting) {
    return item.topic ? `${time} · ${item.topic}` : time;
  }
  return item.kind === CoordinatorAgendaKind.Deadline
    ? t("closesAt", { time })
    : `${time} · ${item.programName}`;
}

function WeekGrid({
  days,
  items,
  capacity,
  selected,
  onSelect,
}: {
  days: Date[];
  items: CoordinatorCalendarItem[];
  selected: CoordinatorCalendarItem | null;
  capacity: number;
  onSelect: (id: string | null) => void;
}) {
  const texts = useCalendarTexts();
  const { t, locale } = texts;
  const today = new Date();
  const hours = Array.from(
    { length: GRID_HOURS },
    (_, index) => GRID_START_HOUR + index,
  );
  return (
    <div className="overflow-x-auto rounded-[28px] border border-[#e9ecef] bg-white">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-[#eef0f2]">
          <span />
          {days.map((day) => (
            <span
              key={day.toISOString()}
              className="py-4 text-center text-[13px] text-[#858c96]"
            >
              {weekdayLabel(day, locale)}{" "}
              {sameDay(day, today) ? (
                <span className="rounded-full bg-[#22262b] px-2 py-0.5 font-medium text-white">
                  {day.getDate()}
                </span>
              ) : (
                <span className="font-medium text-[#22262b]">
                  {day.getDate()}
                </span>
              )}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))]">
          <div>
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: ROW }}
                className="border-b border-[#f4f5f7] pl-3 pt-1 text-[11.5px] text-[#aeb4bc]"
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => {
            const placed = placeDayItems(itemsOnDay(items, day));
            const selectedHere = selected
              ? placed.find((entry) => entry.item.id === selected.id)
              : undefined;
            return (
              <div
                key={day.toISOString()}
                className="relative border-l border-[#f0f2f4]"
                style={{ height: ROW * GRID_HOURS }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: ROW }}
                    className="border-b border-[#f4f5f7]"
                  />
                ))}
                {placed.map((entry) => (
                  <button
                    key={entry.item.id}
                    type="button"
                    onClick={() => onSelect(entry.item.id)}
                    aria-label={`${itemName(entry.item, t)} ${slotLabel(entry.item, locale)}`}
                    style={{
                      top: entry.top * ROW + 2,
                      height: entry.height * ROW - 4,
                      left: 4 + entry.lane * 12,
                      right: 4,
                    }}
                    className={`absolute overflow-hidden rounded-xl border px-2 py-1.5 text-left shadow-[0_1px_2px_rgba(33,38,43,0.06)] ${itemTone(entry.item)} ${
                      selected?.id === entry.item.id
                        ? "ring-2 ring-[#22262b]"
                        : ""
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate text-[12px] font-medium">
                      {entry.item.kind === CoordinatorAgendaKind.Meeting ? (
                        <MeetingDots />
                      ) : null}
                      {entry.item.conflict
                        ? t("conflict")
                        : itemName(entry.item, t)}
                    </span>
                    <span className="block truncate text-[11px] opacity-75">
                      {entry.item.conflict
                        ? itemName(entry.item, t)
                        : itemDetail(entry.item, texts)}
                      {isRecordingFull(entry.item, capacity)
                        ? ` · ${t("recordingFullShort")}`
                        : ""}
                    </span>
                  </button>
                ))}
                {selected && selectedHere ? (
                  <div
                    className={`absolute z-20 w-[300px] ${dayIndex >= 4 ? "right-2" : "left-2"}`}
                    style={{
                      top: Math.min(
                        (selectedHere.top + selectedHere.height) * ROW + 4,
                        ROW * (GRID_HOURS - 4),
                      ),
                    }}
                  >
                    <ItemCard
                      item={selected}
                      capacity={capacity}
                      onClose={() => onSelect(null)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  days,
  month,
  items,
  onSelect,
}: {
  days: Date[];
  month: number;
  items: CoordinatorCalendarItem[];
  onSelect: (id: string) => void;
}) {
  const { t, locale } = useCalendarTexts();
  const today = new Date();
  return (
    <div className="overflow-x-auto rounded-[28px] border border-[#e9ecef] bg-white">
      <div className="grid min-w-[760px] grid-cols-7">
        {days.slice(0, 7).map((day) => (
          <span
            key={`head-${day.toISOString()}`}
            className="border-b border-[#eef0f2] py-3 text-center text-[12.5px] text-[#858c96]"
          >
            {weekdayLabel(day, locale)}
          </span>
        ))}
        {days.map((day) => {
          const dayItems = itemsOnDay(items, day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[112px] border-b border-l border-[#f0f2f4] p-2 ${
                day.getMonth() === month ? "" : "bg-[#fafbfc]"
              }`}
            >
              <span
                className={`inline-block rounded-full px-1.5 text-[12px] ${
                  sameDay(day, today)
                    ? "bg-[#22262b] font-medium text-white"
                    : day.getMonth() === month
                      ? "text-[#22262b]"
                      : "text-[#aeb4bc]"
                }`}
              >
                {day.getDate()}
              </span>
              <ul className="mt-1 space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item.id)}
                      className={`flex w-full items-center gap-1 truncate rounded-md px-1 py-0.5 text-left text-[11px] ${
                        item.conflict ? "text-[#d9464b]" : "text-[#22262b]"
                      }`}
                    >
                      <KindDot item={item} />
                      <span className="truncate">
                        {timeLabel(item.startsAt, locale)} {itemName(item, t)}
                      </span>
                    </button>
                  </li>
                ))}
                {dayItems.length > 3 ? (
                  <li className="px-1 text-[11px] text-[#858c96]">
                    {t("moreItems", { count: dayItems.length - 3 })}
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  days,
  items,
  capacity,
  onSelect,
}: {
  days: Date[];
  items: CoordinatorCalendarItem[];
  capacity: number;
  onSelect: (id: string) => void;
}) {
  const { t, locale } = useCalendarTexts();
  const withItems = days
    .map((day) => ({ day, items: itemsOnDay(items, day) }))
    .filter((group) => group.items.length > 0);
  if (withItems.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#e9ecef] bg-white">
        <EmptyNote>{t("emptyList")}</EmptyNote>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {withItems.map((group) => (
        <section
          key={group.day.toISOString()}
          className="rounded-[24px] border border-[#e9ecef] bg-white px-5 py-3"
        >
          <h2 className="py-2 text-[13px] font-medium text-[#22262b]">
            {longDayLabel(group.day, locale)}
          </h2>
          <ul className="divide-y divide-[#f0f2f4]">
            {group.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="grid w-full grid-cols-[64px_16px_1fr_auto] items-center gap-2 py-2.5 text-left"
                >
                  <span className="text-[12.5px] text-[#858c96]">
                    {timeLabel(item.startsAt, locale)}
                  </span>
                  <KindDot item={item} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] text-[#22262b]">
                      {itemName(item, t)}
                    </span>
                    <span className="block truncate text-[12px] text-[#858c96]">
                      {item.kind === CoordinatorAgendaKind.Meeting
                        ? (item.topic ?? item.title)
                        : item.programName}
                    </span>
                  </span>
                  <span className="flex gap-2 text-[12px]">
                    {item.conflict ? (
                      <span className="text-[#d9464b]">{t("conflict")}</span>
                    ) : null}
                    {isRecordingFull(item, capacity) ? (
                      <span className="text-[#9e4400]">
                        {t("recordingFullShort")}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ItemCard({
  item,
  capacity,
  onClose,
}: {
  item: CoordinatorCalendarItem;
  capacity: number;
  onClose: () => void;
}) {
  const { t, locale } = useCalendarTexts();
  const meeting = item.kind === CoordinatorAgendaKind.Meeting;
  const recording = meeting ? recordingNote(item, capacity, t) : null;
  const facts = [
    item.topic ? t("topic", { topic: item.topic }) : null,
    item.sequence ? t("sequence", { n: item.sequence }) : null,
  ].filter(Boolean);
  return (
    <article
      aria-label={t("itemDetail")}
      className="rounded-[24px] border border-[#e9ecef] bg-white p-5 shadow-[0_12px_32px_rgba(33,38,43,0.12)]"
    >
      <div className="flex items-start gap-3">
        {meeting ? (
          <span className="flex -space-x-1.5">
            <Avatar initials={initials(item.mentorName ?? "M")} tone="blue" />
            <Avatar initials={initials(item.organizationName ?? "T")} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-medium text-[#22262b]">
            {item.proposalId
              ? t("proposedSlot")
              : meeting
                ? t("meetingKind")
                : item.title}
          </p>
          <p className="truncate text-[12.5px] text-[#858c96]">
            {meeting ? itemName(item, t) : item.programName}
          </p>
        </div>
        <button
          type="button"
          aria-label={t("closeDetail")}
          onClick={onClose}
          className="text-[#aeb4bc]"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <ul className="mt-4 space-y-1.5 text-[12.5px] text-[#22262b]">
        <li>{slotLabel(item, locale)}</li>
        {item.proposalId ? (
          <li>{t("awaitingApproval")}</li>
        ) : meeting ? (
          <li>{item.meetLink ? t("onlineMeet") : t("meeting")}</li>
        ) : null}
        {meeting && facts.length > 0 ? <li>{facts.join(" · ")}</li> : null}
        {recording ? (
          <li
            className={
              isRecordingFull(item, capacity) ? "text-[#9e4400]" : undefined
            }
          >
            {recording}
          </li>
        ) : null}
        {item.description ? (
          <li className="text-[#676e78]">{item.description}</li>
        ) : null}
      </ul>
      {meeting ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.mentorshipId ? (
            <Link
              href={mentorshipHref(item.mentorshipId)}
              className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white"
            >
              {t("openMentorship")}
            </Link>
          ) : null}
          {item.mentorId ? (
            <Link
              href={coordinatorMessageHref(item.programId, item.mentorId)}
              className="inline-flex h-9 items-center rounded-full border border-[#e9ecef] px-4 text-[12.5px] font-medium text-[#22262b]"
            >
              {t("message")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function RecordingCapacity({ data }: { data: CoordinatorCalendar }) {
  const { t } = useCalendarTexts();
  const full = fullRecordingCount(data);
  if (full === 0) return null;
  return (
    <article className="rounded-[24px] border border-[#ffd8b0] bg-[#fff6ed] p-5">
      <p className="text-[14px] font-medium text-[#9e4400]">
        {t("capacityTitle")}
      </p>
      <p className="mt-2 text-[13px] text-[#22262b]">
        {t("capacityBody", { capacity: data.recordingCapacity, full })}
      </p>
    </article>
  );
}

function Conflicts({
  data,
  onReschedule,
}: {
  data: CoordinatorCalendar;
  onReschedule: (meeting: CoordinatorCalendarItem) => void;
}) {
  const texts = useCalendarTexts();
  const { t } = texts;
  return (
    <>
      {data.conflicts.map((conflict) => {
        const summary = conflictSummary(conflict, data.items, texts);
        const first = data.items.find(
          (item) => item.id === conflict.meetingIds[0],
        );
        // The later of the overlapping meetings is the one proposed a new time.
        const later = data.items.find(
          (item) =>
            item.id === conflict.meetingIds[conflict.meetingIds.length - 1],
        );
        return (
          <article
            key={conflict.meetingIds.join("-")}
            className="rounded-[24px] border border-[#f5c9ca] bg-[#fdf3f3] p-5"
          >
            <p className="flex items-center gap-2 text-[14px]">
              <span className="size-2 rounded-full bg-[#d9464b]" />
              <span className="font-medium text-[#d9464b]">
                {summary.heading}
              </span>
              <span className="text-[12.5px] text-[#858c96]">
                {summary.who}
              </span>
            </p>
            <p className="mt-2 text-[13px] text-[#22262b]">{summary.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {later?.mentorshipId ? (
                <button
                  type="button"
                  onClick={() => onReschedule(later)}
                  className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white"
                >
                  {t("reschedule")}
                </button>
              ) : null}
              {first ? (
                <Link
                  href={coordinatorMessageHref(
                    first.programId,
                    conflict.mentorId,
                  )}
                  className="inline-flex h-9 items-center rounded-full border border-[#e9ecef] bg-white px-4 text-[12.5px] font-medium text-[#22262b]"
                >
                  {t("askMentor")}
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </>
  );
}

function Summary({
  data,
  period,
  onOpenList,
  showListLink,
}: {
  data: CoordinatorCalendar;
  period: string;
  onOpenList: () => void;
  showListLink: boolean;
}) {
  const { t } = useCalendarTexts();
  const rows = [
    {
      label: t("meetingKind"),
      value: data.summary.meetings,
      dot: <MeetingDots />,
    },
    {
      label: t("eventKind"),
      value: data.summary.events,
      dot: <span className="size-2 rounded-full bg-[#22262b]" />,
    },
    {
      label: t("deadlineKind"),
      value: data.summary.deadlines,
      dot: <span className="size-2 rounded-full bg-[#b7791f]" />,
    },
    {
      label: t("unscheduled"),
      value: data.summary.unscheduledRisky,
      dot: <span className="size-2 rounded-full bg-[#d9464b]" />,
    },
  ];
  return (
    <article
      aria-label={period}
      className="rounded-[24px] border border-[#e9ecef] bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[14.5px] font-medium text-[#22262b]">{period}</h2>
        <span className="text-[12px] text-[#858c96]">
          {t("itemCount", { count: data.items.length })}
        </span>
      </div>
      <dl className="mt-3 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-[13px]"
          >
            <dt className="flex items-center gap-2 text-[#22262b]">
              {row.dot}
              {row.label}
            </dt>
            <dd className="font-medium text-[#22262b]">{row.value}</dd>
          </div>
        ))}
      </dl>
      {showListLink ? (
        <button
          type="button"
          onClick={onOpenList}
          className="mt-4 inline-flex items-center gap-1 text-[12.5px] text-[#676e78]"
        >
          {t("openList")} <ArrowRight aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </article>
  );
}

function EventForm({
  draft,
  programs,
  error,
  saving,
  onChange,
  onSave,
  onClose,
}: {
  draft: EventDraft;
  programs: CoordinatorProgram[];
  error: string | null;
  saving: boolean;
  onChange: (patch: Partial<EventDraft>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("coordinatorCalendar.form");
  const tKind = useTranslations("coordinatorCalendar");
  const field =
    "mt-1 h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13px] text-[#22262b] outline-none";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#22262b]/20 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
        className="w-full max-w-[460px] space-y-4 rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(33,38,43,0.18)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[#22262b]">
            {t("title")}
          </h2>
          <button type="button" aria-label={t("close")} onClick={onClose}>
            <X aria-hidden className="size-4 text-[#858c96]" />
          </button>
        </div>
        <label className="block text-[12.5px] text-[#676e78]">
          {t("program")}
          <select
            value={draft.programId}
            onChange={(event) => onChange({ programId: event.target.value })}
            className={field}
          >
            <option value="">{t("choose")}</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12.5px] text-[#676e78]">
          {t("eventTitle")}
          <input
            value={draft.title}
            maxLength={160}
            onChange={(event) => onChange({ title: event.target.value })}
            className={field}
          />
        </label>
        <fieldset className="flex gap-2 text-[13px]">
          <legend className="mb-1 text-[12.5px] text-[#676e78]">
            {t("kind")}
          </legend>
          {[
            { kind: ProgramEventKind.Event, label: tKind("eventKind") },
            { kind: ProgramEventKind.Deadline, label: tKind("deadlineKind") },
          ].map((option) => (
            <label
              key={option.kind}
              className="flex items-center gap-1.5 rounded-full border border-[#e9ecef] px-3 py-1.5"
            >
              <input
                type="radio"
                name="event-kind"
                checked={draft.kind === option.kind}
                onChange={() =>
                  onChange({
                    kind: option.kind,
                    endTime:
                      option.kind === ProgramEventKind.Deadline
                        ? ""
                        : draft.endTime,
                  })
                }
              />
              {option.label}
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-3 gap-3">
          <label className="block text-[12.5px] text-[#676e78]">
            {t("date")}
            <input
              type="date"
              value={draft.day}
              onChange={(event) => onChange({ day: event.target.value })}
              className={field}
            />
          </label>
          <label className="block text-[12.5px] text-[#676e78]">
            {draft.kind === ProgramEventKind.Deadline ? t("time") : t("start")}
            <input
              type="time"
              value={draft.startTime}
              onChange={(event) => onChange({ startTime: event.target.value })}
              className={field}
            />
          </label>
          {draft.kind === ProgramEventKind.Event ? (
            <label className="block text-[12.5px] text-[#676e78]">
              {t("end")}
              <input
                type="time"
                value={draft.endTime}
                onChange={(event) => onChange({ endTime: event.target.value })}
                className={field}
              />
            </label>
          ) : null}
        </div>
        <label className="block text-[12.5px] text-[#676e78]">
          {t("description")}
          <textarea
            value={draft.description}
            maxLength={2000}
            rows={3}
            onChange={(event) => onChange({ description: event.target.value })}
            className="mt-1 w-full rounded-xl border border-[#e9ecef] px-3 py-2 text-[13px] text-[#22262b] outline-none"
          />
        </label>
        {error ? (
          <p role="alert" className="text-[12.5px] text-[#d9464b]">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full border border-[#e9ecef] px-4 text-[13px]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white disabled:bg-[#858c96]"
          >
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}

/** "Yeniden planla": proposes a new time for the meeting; both sides confirm before it moves. */
function RescheduleDialog({
  meeting,
  mentorshipId,
  onDone,
}: {
  meeting: CoordinatorCalendarItem;
  mentorshipId: string;
  onDone: () => void;
}) {
  const { t } = useCalendarTexts();
  const proposals = useMentorshipMeetingProposals(mentorshipId, {
    reschedule: meeting.id,
    onDone,
  });
  return (
    <ProposeMeetingDialog
      proposals={proposals}
      pairLabel={itemName(meeting, t)}
    />
  );
}
