"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { MaskIcon } from "@/components/mobile/mask-icon";
import {
  MobileEmptyState,
  MobileErrorState,
  MobileListSkeleton,
} from "@/components/mobile/mobile-states";
import { useMobileCalendar } from "@/hooks/use-mobile-calendar";
import {
  JOIN_LEAD_MINUTES,
  MobileAgendaKind,
  MONTH_WEEKDAY_LABELS,
  type MobileAgendaEntry,
} from "@/lib/mobile-calendar";
import {
  AWAITING_APPROVAL_LABEL,
  type MentorEntryDetail,
} from "@/lib/mobile-mentor-calendar";
import { initials } from "@/lib/utils";

type Calendar = ReturnType<typeof useMobileCalendar>;

const BAR_CLASS: Record<MobileAgendaKind, string> = {
  [MobileAgendaKind.Meeting]: "bg-gradient-to-b from-[#26a4ff] to-[#ff6a3d]",
  [MobileAgendaKind.Event]: "bg-[#aeb4bc]",
  [MobileAgendaKind.Deadline]: "bg-[#b7791f]",
};

const DOT_CLASS: Record<MobileAgendaKind, string> = {
  [MobileAgendaKind.Meeting]: "bg-[#26a4ff]",
  [MobileAgendaKind.Event]: "bg-[#aeb4bc]",
  [MobileAgendaKind.Deadline]: "bg-[#b7791f]",
};

function Dots({ kinds }: { kinds: MobileAgendaKind[] }) {
  return (
    <span className="flex h-1.5 items-center gap-1" aria-hidden="true">
      {kinds.map((kind) => (
        <span
          key={kind}
          className={`size-1.5 rounded-full ${DOT_CLASS[kind]}`}
        />
      ))}
    </span>
  );
}

function WeekStrip({ calendar }: { calendar: Calendar }) {
  return (
    <ol className="flex justify-between" aria-label="Hafta">
      {calendar.strip.map((day) => (
        <li key={day.date.toISOString()}>
          <button
            type="button"
            onClick={() => calendar.selectDay(day.date)}
            aria-pressed={day.isSelected}
            aria-label={`${day.weekday} ${day.dayNumber}${day.isToday ? ", bugün" : ""}`}
            className={`flex w-[46px] flex-col items-center gap-1 rounded-[18px] py-2.5 leading-[1.35] ${
              day.isSelected ? "bg-[#22262b]" : ""
            }`}
          >
            <span
              className={`text-xs font-medium ${
                day.isSelected ? "text-[#c9cdd2]" : "text-[#858c96]"
              }`}
            >
              {day.weekday}
            </span>
            <span
              className={`text-[17px] font-semibold ${
                day.isSelected
                  ? "text-white"
                  : day.isWeekend
                    ? "text-[#aeb4bc]"
                    : "text-[#22262b]"
              }`}
            >
              {day.dayNumber}
            </span>
            <Dots kinds={day.kinds} />
          </button>
        </li>
      ))}
    </ol>
  );
}

// Mentees' next card is orange, mentors' is blue.
const NEXT_TONE = {
  mentee: {
    card: "border border-[#ffdccd] bg-[#fff7f3]",
    chip: "bg-[#fff1ec] text-[#e0522a]",
  },
  mentor: {
    card: "border border-[#cfe9ff] bg-[#eff8ff]",
    chip: "bg-[#eaf6ff] text-[#1583d6]",
  },
};

function AgendaCard({
  entry,
  nextLabel,
  isMentor,
  onOpen,
}: {
  entry: MobileAgendaEntry;
  nextLabel: string | null;
  isMentor: boolean;
  onOpen: () => void;
}) {
  const tone = isMentor ? NEXT_TONE.mentor : NEXT_TONE.mentee;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-start gap-3.5 rounded-[22px] p-4 text-left ${
        nextLabel ? tone.card : "bg-[#f5f6f8]"
      }`}
    >
      <span className="flex w-[52px] shrink-0 flex-col gap-0.5 leading-[1.35]">
        <span className="text-[15px] font-semibold text-[#22262b]">
          {entry.time}
        </span>
        <span className="text-xs text-[#858c96]">{entry.length}</span>
      </span>
      <span
        aria-hidden="true"
        className={`w-1 shrink-0 self-stretch rounded-[2px] ${BAR_CLASS[entry.kind]}`}
      />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1 leading-[1.35]">
        <span className="flex items-center gap-2 text-[15.5px] font-semibold text-[#22262b]">
          {entry.startup ? (
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#fff1ec] text-[9px] text-[#e0522a]"
            >
              {entry.startup.initials}
            </span>
          ) : null}
          {entry.title}
          {entry.awaitingApproval ? (
            <span className="rounded-full bg-[#fff6e5] px-2 py-0.5 text-[11px] font-medium text-[#b7791f]">
              {AWAITING_APPROVAL_LABEL}
            </span>
          ) : null}
        </span>
        <span className="text-[13px] text-[#676e78]">{entry.detail}</span>
        {nextLabel ? (
          <span
            className={`rounded-full px-2.5 py-[5px] text-xs font-medium ${tone.chip}`}
          >
            {nextLabel}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function InfoRow({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f5f6f8]">
        <Image src={icon} alt="" width={20} height={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.35]">
        {children}
      </div>
    </div>
  );
}

type EntryDetail = NonNullable<Calendar["detail"]>;

function Person({
  initials: short,
  name,
  role,
  square,
}: {
  initials: string;
  name: string;
  role: string;
  square: boolean;
}) {
  return (
    <p className="flex items-center gap-2.5">
      <span
        className={`flex size-8 shrink-0 items-center justify-center text-xs font-semibold ${
          square
            ? "rounded-[10px] bg-[#fff1ec] text-[#e0522a]"
            : "rounded-full bg-[#eaf6ff] text-[#1583d6]"
        }`}
      >
        {short}
      </span>
      <span className="flex flex-col gap-px">
        <span className="text-[14.5px] font-medium text-[#22262b]">{name}</span>
        {role ? (
          <span
            className={`text-[12.5px] ${square ? "text-[#e0522a]" : "text-[#1583d6]"}`}
          >
            {role}
          </span>
        ) : null}
      </span>
    </p>
  );
}

function LinkRow({ detail }: { detail: EntryDetail }) {
  if (!detail.link) return null;
  return (
    <InfoRow icon="/mobile/icon-link.svg">
      <p className="text-[15px] font-medium text-[#22262b]">
        {detail.link.label}
      </p>
      <p className="truncate text-[13px] text-[#858c96]">{detail.link.text}</p>
    </InfoRow>
  );
}

function MenteeRows({ detail }: { detail: EntryDetail }) {
  const { entry } = detail;
  const meeting = entry.meeting;
  return (
    <>
      <div className="flex flex-col gap-2 leading-[1.35]">
        <p className="flex items-center gap-2 text-[13px] font-medium text-[#676e78]">
          <Dots kinds={[entry.kind]} />
          {detail.kindLabel}
        </p>
        <h2
          id="calendar-entry-title"
          className="text-[22px] font-bold text-[#22262b]"
        >
          {entry.title}
        </h2>
      </div>
      <InfoRow icon="/mobile/icon-time.svg">
        <p className="text-[15px] font-medium text-[#22262b]">
          {detail.timeLine}
        </p>
        <p className="text-[13px] text-[#858c96]">{detail.timeHint}</p>
      </InfoRow>
      {meeting ? (
        <InfoRow icon="/mobile/icon-people.svg">
          <div className="flex flex-col gap-2.5">
            <Person
              initials={initials(meeting.mentorName ?? "Mentör")}
              name={meeting.mentorName ?? "Mentör"}
              role="Mentor"
              square={false}
            />
            {meeting.organizationName ? (
              <Person
                initials={initials(meeting.organizationName)}
                name={meeting.organizationName}
                role=""
                square
              />
            ) : null}
          </div>
        </InfoRow>
      ) : null}
      <LinkRow detail={detail} />
      {meeting?.agenda || entry.event?.description ? (
        <InfoRow icon="/mobile/icon-agenda.svg">
          <p className="text-[15px] font-medium text-[#22262b]">
            {meeting ? "Gündem" : "Açıklama"}
          </p>
          <p className="text-[13px] whitespace-pre-line text-[#858c96]">
            {meeting?.agenda ?? entry.event?.description}
          </p>
        </InfoRow>
      ) : null}
    </>
  );
}

function MentorRows({
  detail,
  mentor,
}: {
  detail: EntryDetail;
  mentor: MentorEntryDetail;
}) {
  return (
    <>
      <div className="flex flex-col gap-2 leading-[1.35]">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#676e78]">
          <Dots kinds={[detail.entry.kind]} />
          {detail.kindLabel}
          {mentor.startsIn ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[#eaf6ff] px-2.5 py-[5px] text-xs text-[#1583d6]">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-[#26a4ff]"
              />
              {mentor.startsIn}
            </span>
          ) : null}
        </div>
        <h2
          id="calendar-entry-title"
          className="text-[22px] font-bold text-[#22262b]"
        >
          {mentor.title}
        </h2>
      </div>
      <InfoRow icon="/mobile/icon-time.svg">
        <p className="text-[15px] font-medium text-[#22262b]">
          {mentor.timeLine}
        </p>
        <p className="text-[13px] text-[#858c96]">{mentor.timeHint}</p>
      </InfoRow>
      <InfoRow icon="/mobile/icon-people.svg">
        <div className="flex flex-col gap-2.5">
          <Person
            initials={mentor.startup.initials}
            name={mentor.startup.name}
            role={mentor.startup.people}
            square
          />
          <Person
            initials={mentor.self.initials}
            name={mentor.self.name}
            role="Sen · Mentor"
            square={false}
          />
        </div>
      </InfoRow>
      <LinkRow detail={detail} />
      <InfoRow icon="/mobile/icon-agenda.svg">
        <p className="text-[15px] font-medium text-[#22262b]">
          {mentor.topic.title}
        </p>
        {mentor.topic.agenda ? (
          <p className="text-[13px] whitespace-pre-line text-[#858c96]">
            {mentor.topic.agenda}
          </p>
        ) : null}
      </InfoRow>
    </>
  );
}

function MessageLink({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e9ecef] bg-white px-[22px] py-[15px] text-[15px] leading-[1.35] font-semibold text-[#22262b]"
    >
      <Image
        src="/mobile/icon-message-button.svg"
        alt=""
        width={18}
        height={18}
      />
      Mesaj gönder
    </Link>
  );
}

function SheetActions({ detail }: { detail: EntryDetail }) {
  return (
    <div className="flex flex-col items-center gap-2.5 pt-2">
      {detail.isOver ? null : detail.canJoin && detail.link ? (
        <a
          href={detail.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--mobile-accent)] px-[22px] py-[15px] text-[15px] leading-[1.35] font-semibold text-white"
        >
          <MaskIcon src="/mobile/icon-link-button.svg" size={18} />
          Toplantıya katıl
        </a>
      ) : (
        <>
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#eef0f2] px-[22px] py-[15px] text-[15px] leading-[1.35] font-semibold text-[#aeb4bc]"
          >
            <Image
              src="/mobile/icon-link-button.svg"
              alt=""
              width={18}
              height={18}
            />
            Toplantıya katıl
          </button>
          <p className="text-[12.5px] leading-[1.35] text-[#858c96]">
            {detail.link
              ? `Bağlantı görüşmeden ${JOIN_LEAD_MINUTES} dk önce aktif olur`
              : "Bu görüşmenin henüz bağlantısı yok"}
          </p>
        </>
      )}
      <MessageLink href={detail.messageHref} />
    </div>
  );
}

function EntrySheet({ calendar }: { calendar: Calendar }) {
  const detail = calendar.detail;
  if (!detail) return null;
  return (
    <BottomSheet
      labelledBy="calendar-entry-title"
      onClose={calendar.closeEntry}
    >
      {detail.mentor ? (
        <MentorRows detail={detail} mentor={detail.mentor} />
      ) : (
        <MenteeRows detail={detail} />
      )}
      {detail.entry.meeting ? (
        <SheetActions detail={detail} />
      ) : (
        <div className="pt-2">
          <MessageLink href={detail.messageHref} />
        </div>
      )}
    </BottomSheet>
  );
}

function MonthSheet({ calendar }: { calendar: Calendar }) {
  const month = calendar.month;
  if (!month.isOpen) return null;
  return (
    <BottomSheet labelledBy="calendar-month-title" onClose={month.close}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={month.previous}
          aria-label="Önceki ay"
          className="flex size-10 items-center justify-center rounded-full bg-[#f5f6f8]"
        >
          <Image src="/mobile/icon-back.svg" alt="" width={20} height={20} />
        </button>
        <h2
          id="calendar-month-title"
          className="text-[17px] leading-[1.35] font-semibold text-[#22262b]"
        >
          {month.label}
        </h2>
        <button
          type="button"
          onClick={month.next}
          aria-label="Sonraki ay"
          className="flex size-10 rotate-180 items-center justify-center rounded-full bg-[#f5f6f8]"
        >
          <Image src="/mobile/icon-back.svg" alt="" width={20} height={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center leading-[1.35]">
        {MONTH_WEEKDAY_LABELS.map((label) => (
          <span key={label} className="py-1 text-xs font-medium text-[#858c96]">
            {label}
          </span>
        ))}
        {month.cells.map((cell) => (
          <button
            key={cell.date.toISOString()}
            type="button"
            onClick={() => month.pick(cell.date)}
            aria-pressed={cell.isSelected}
            className={`mx-auto flex size-11 flex-col items-center justify-center gap-0.5 rounded-2xl text-[15px] font-semibold ${
              cell.isSelected
                ? "bg-[#22262b] text-white"
                : cell.isToday
                  ? "text-[var(--mobile-accent)]"
                  : cell.inMonth
                    ? "text-[#22262b]"
                    : "text-[#c9cdd2]"
            }`}
          >
            {cell.date.getDate()}
            <Dots kinds={cell.kinds} />
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-[13px] leading-[1.35] text-[#676e78]">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Dots kinds={[MobileAgendaKind.Meeting]} /> Görüşme
          </span>
          <span className="flex items-center gap-1.5">
            <Dots kinds={[MobileAgendaKind.Event]} /> Etkinlik
          </span>
        </span>
        <button
          type="button"
          onClick={month.today}
          className="font-semibold text-[#22262b]"
        >
          Bugüne dön
        </button>
      </div>
    </BottomSheet>
  );
}

export function MobileCalendarView() {
  const calendar = useMobileCalendar();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-[28px] leading-[1.35] font-bold text-[#22262b]">
          Takvim
        </h1>
        <button
          type="button"
          onClick={calendar.month.open}
          className="flex items-center gap-1.5 rounded-full bg-[#f5f6f8] px-3.5 py-2.5 text-sm leading-[1.35] font-semibold text-[#22262b]"
        >
          {calendar.title}
          <Image
            src="/mobile/icon-chevron-down.svg"
            alt=""
            width={16}
            height={16}
          />
        </button>
      </header>

      <WeekStrip calendar={calendar} />

      {calendar.isLoading ? (
        <MobileListSkeleton />
      ) : calendar.isError ? (
        <MobileErrorState
          title="Takvim yüklenemedi."
          onRetry={calendar.retry}
        />
      ) : calendar.agenda.length === 0 ? (
        <MobileEmptyState
          title="Bu hafta planlı bir şey yok."
          description="Başka bir güne ya da aya bakmak için tarihlere dokun."
        />
      ) : (
        calendar.agenda.map((day) => (
          <section
            key={day.key}
            aria-label={day.heading}
            className="flex flex-col gap-2.5"
          >
            <h2 className="text-sm leading-[1.35] font-semibold text-[#676e78]">
              {day.heading}
            </h2>
            {day.entries.map((entry) => (
              <AgendaCard
                key={entry.id}
                entry={entry}
                nextLabel={
                  entry.id === calendar.nextId ? calendar.nextLabel : null
                }
                isMentor={calendar.isMentor}
                onOpen={() => calendar.openEntry(entry.id)}
              />
            ))}
          </section>
        ))
      )}

      <EntrySheet calendar={calendar} />
      <MonthSheet calendar={calendar} />
    </div>
  );
}
