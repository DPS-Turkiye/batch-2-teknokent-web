"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MeetingNotesPanel } from "@/components/startup/meeting-notes-panel";
import { MeetingTimeline } from "@/components/startup/meeting-timeline";
import { MeetingTopicGrid } from "@/components/startup/meeting-topic-grid";
import { MeetingTopicStackDialog } from "@/components/startup/meeting-topic-stack-dialog";
import { useOpenDocument } from "@/hooks/use-startup-documents";
import {
  MeetingLayout,
  useStartupMeetings,
} from "@/hooks/use-startup-meetings";
import {
  meetingNotebookHref,
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
    [StartupMeetingView.Mentor]: {
      idle: "/startup/mentor.svg",
      active: "/startup/mentor.svg",
    },
  };

const chipClass =
  "flex h-10 items-center gap-1.5 rounded-3xl border bg-white px-6 text-sm leading-5 transition";
const activeChip = "border-[#e86f22] text-[#e86f22]";
const idleChip = "border-[#fff4ec] text-[#858c96] hover:border-[#fbe2d0]";

const HUB_VIEWS = [
  StartupMeetingView.Topic,
  StartupMeetingView.Time,
  StartupMeetingView.Mentor,
] as const;

export function StartupMeetingsView({
  hideNotesChip = false,
}: {
  hideNotesChip?: boolean;
}) {
  const t = useTranslations("startupMeetings");
  const router = useRouter();
  const meetings = useStartupMeetings();
  const openDocument = useOpenDocument();
  const views = hideNotesChip ? HUB_VIEWS : Object.values(StartupMeetingView);

  function openMeeting(meetingId: string) {
    if (hideNotesChip) {
      meetings.closeTopicStack();
      router.push(meetingNotebookHref(meetingId));
      return;
    }
    meetings.openMeetingNotes(meetingId);
  }

  if (meetings.isLoading) {
    return <p className="py-10 text-sm text-[#858c96]">{t("loading")}</p>;
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

  const view =
    hideNotesChip && meetings.view === StartupMeetingView.Notes
      ? StartupMeetingView.Topic
      : meetings.view;

  return (
    <div className="space-y-5">
      <div
        role="toolbar"
        aria-label={t("toolbar")}
        className="flex flex-wrap items-center gap-3"
      >
        {layoutButton(MeetingLayout.List, t("list"))}
        {layoutButton(MeetingLayout.Grid, t("grid"))}
        {views.map((item) => {
          const selected = view === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              onClick={() => meetings.setView(item)}
              className={`${chipClass} ${selected ? activeChip : idleChip}`}
            >
              <Image
                src={selected ? VIEW_ICONS[item].active : VIEW_ICONS[item].idle}
                alt=""
                width={24}
                height={24}
              />
              {t(`views.${item}`)}
            </button>
          );
        })}
      </div>

      {meetings.meetingCount === 0 ? (
        <div className="rounded-[24px] border border-[#e4e7ea] p-6 text-sm text-[#676e78]">
          {t("empty")}{" "}
          <Link href="/calendar" className="text-[#e86f22] underline">
            {t("plan")}
          </Link>
        </div>
      ) : view === StartupMeetingView.Topic ? (
        <MeetingTopicGrid
          details={meetings.details}
          layout={meetings.layout}
          onOpenTopic={meetings.openTopicStack}
          topics={meetings.topics}
        />
      ) : view === StartupMeetingView.Time ? (
        <MeetingTimeline
          details={meetings.details}
          expandedMonthKey={meetings.expandedMonthKey}
          expandedYear={meetings.expandedYear}
          onOpenFile={(id) => void openDocument(id)}
          onOpenMeeting={openMeeting}
          onToggleMonth={meetings.toggleMonth}
          onToggleYear={meetings.toggleYear}
          years={meetings.years}
        />
      ) : view === StartupMeetingView.Mentor ? (
        <MeetingTopicGrid
          details={meetings.details}
          kind="mentor"
          layout={meetings.layout}
          onOpenTopic={meetings.openTopicStack}
          topics={meetings.mentors}
        />
      ) : meetings.selectedMeeting ? (
        <MeetingNotesPanel
          details={meetings.details}
          meeting={meetings.selectedMeeting}
          onOpenFile={(id) => void openDocument(id)}
          onSelectMeeting={openMeeting}
          otherMeetings={meetings.otherMeetings}
        />
      ) : null}

      {meetings.selectedTopic ? (
        <MeetingTopicStackDialog
          details={meetings.details}
          onClose={meetings.closeTopicStack}
          onOpenFile={(id) => void openDocument(id)}
          onSelectMeeting={openMeeting}
          topic={meetings.selectedTopic}
        />
      ) : null}
    </div>
  );
}
