"use client";

import Image from "next/image";
import Link from "next/link";

import { MeetingNotesPanel } from "@/components/startup/meeting-notes-panel";
import { MeetingTimeline } from "@/components/startup/meeting-timeline";
import { MeetingTopicGrid } from "@/components/startup/meeting-topic-grid";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import {
  MeetingLayout,
  useStartupMeetings,
} from "@/hooks/use-startup-meetings";
import {
  STARTUP_MEETING_VIEW_LABELS,
  StartupMeetingView,
} from "@/lib/startup-meetings";

const VIEW_ICONS: Record<StartupMeetingView, { idle: string; active: string }> =
  {
    [StartupMeetingView.Topic]: {
      idle: "/startup/topic.svg",
      active: "/startup/topic-active.svg",
    },
    [StartupMeetingView.Time]: {
      idle: "/startup/calendar-gray.svg",
      active: "/startup/calendar-orange.svg",
    },
    [StartupMeetingView.Notes]: {
      idle: "/startup/notebook.svg",
      active: "/startup/notebook-active.svg",
    },
  };

const chipClass =
  "flex h-10 items-center gap-1.5 rounded-3xl border bg-white px-6 text-sm leading-5 transition";
const activeChip = "border-[#e86f22] text-[#e86f22]";
const idleChip = "border-[#fff4ec] text-[#858c96] hover:border-[#fbe2d0]";

export function StartupMeetingsView() {
  const meetings = useStartupMeetings();
  const openDocument = useOpenDocument();

  if (meetings.isLoading) {
    return (
      <p className="py-10 text-sm text-[#858c96]">Toplantılar yükleniyor…</p>
    );
  }
  if (meetings.error) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {meetings.error.message}
      </p>
    );
  }

  const layoutButton = (layout: MeetingLayout, label: string) => {
    const selected = meetings.layout === layout;
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={selected}
        onClick={() => meetings.setLayout(layout)}
        className={`grid size-10 place-items-center rounded-3xl border bg-white ${selected ? "border-[#e86f22] text-[#e86f22]" : "border-[#fff4ec] text-[#aeb4bc]"}`}
      >
        {layout === MeetingLayout.List ? (
          <Image src="/startup/view-list.svg" alt="" width={16} height={10} />
        ) : (
          <span aria-hidden className="grid size-4 grid-cols-2 gap-[3px]">
            {[0, 1, 2, 3].map((cell) => (
              <span
                key={cell}
                className="rounded-[1px] border border-current"
              />
            ))}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <div
        role="toolbar"
        aria-label="Toplantı görünümü"
        className="flex flex-wrap items-center gap-3"
      >
        {layoutButton(MeetingLayout.List, "Liste görünümü")}
        {layoutButton(MeetingLayout.Grid, "Kart görünümü")}
        {Object.values(StartupMeetingView).map((view) => {
          const selected = meetings.view === view;
          return (
            <button
              key={view}
              type="button"
              aria-pressed={selected}
              onClick={() => meetings.setView(view)}
              className={`${chipClass} ${selected ? activeChip : idleChip}`}
            >
              <Image
                src={selected ? VIEW_ICONS[view].active : VIEW_ICONS[view].idle}
                alt=""
                width={24}
                height={24}
              />
              {STARTUP_MEETING_VIEW_LABELS[view]}
            </button>
          );
        })}
        <label
          className={`${chipClass} ${meetings.mentorId ? activeChip : idleChip}`}
        >
          <Image src="/startup/mentor.svg" alt="" width={24} height={24} />
          <select
            aria-label="Mentora göre filtrele"
            value={meetings.mentorId}
            onChange={(event) => meetings.setMentorId(event.target.value)}
            className="cursor-pointer bg-transparent outline-none"
          >
            <option value="">Mentor</option>
            {meetings.mentorOptions.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {meetings.meetingCount === 0 ? (
        <div className="rounded-[24px] border border-[#e4e7ea] p-6 text-sm text-[#676e78]">
          Henüz bir toplantı yok.{" "}
          <Link href="/calendar" className="text-[#e86f22] underline">
            Takvimden toplantı planla
          </Link>
        </div>
      ) : meetings.view === StartupMeetingView.Topic ? (
        <MeetingTopicGrid
          details={meetings.details}
          layout={meetings.layout}
          onOpen={meetings.openMeetingNotes}
          topics={meetings.topics}
        />
      ) : meetings.view === StartupMeetingView.Time ? (
        <MeetingTimeline
          details={meetings.details}
          expandedMonthKey={meetings.expandedMonthKey}
          expandedYear={meetings.expandedYear}
          onOpenFile={(id) => void openDocument(id)}
          onOpenMeeting={meetings.openMeetingNotes}
          onToggleMonth={meetings.toggleMonth}
          onToggleYear={meetings.toggleYear}
          years={meetings.years}
        />
      ) : meetings.selectedMeeting ? (
        <MeetingNotesPanel
          details={meetings.details}
          meeting={meetings.selectedMeeting}
          onOpenFile={(id) => void openDocument(id)}
          onSelectMeeting={meetings.openMeetingNotes}
          otherMeetings={meetings.otherMeetings}
        />
      ) : null}
    </div>
  );
}
