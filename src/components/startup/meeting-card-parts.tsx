"use client";

import Image from "next/image";

import { Avatar } from "@/components/common/avatar";
import type { MeetingItem } from "@/interfaces/meeting";
import type { StartupDocument } from "@/interfaces/startup-document";
import { MEETING_TIMING_LABELS, MeetingTiming } from "@/lib/startup-meetings";
import { formatLongDate, initials } from "@/lib/utils";

const VISIBLE_FILES = 2;

export function MeetingPerson({
  meeting,
  mentorTitle,
}: {
  meeting: MeetingItem;
  mentorTitle: string | null;
}) {
  const name = meeting.mentorName ?? "Mentor";
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm leading-6 text-[#676e78]">
      <Avatar initials={initials(name) || "?"} tone="orange" size="sm" />
      <span className="truncate">
        {name}
        {mentorTitle ? (
          <span className="text-[#aeb4bc]"> · {mentorTitle}</span>
        ) : null}
      </span>
    </p>
  );
}

export function MeetingWhen({
  meeting,
  timing,
  dateOnly = false,
}: {
  meeting: MeetingItem;
  timing: MeetingTiming;
  dateOnly?: boolean;
}) {
  return (
    <span className="flex items-center gap-1 text-xs leading-5 text-[#e86f22]">
      <Image src="/startup/calendar-orange.svg" alt="" width={20} height={20} />
      {!dateOnly && timing === MeetingTiming.Held ? (
        <>
          Son görüşme
          <span aria-hidden className="size-1.5 rounded-full bg-[#e86f22]" />
        </>
      ) : null}
      <time dateTime={meeting.scheduledAt}>
        {formatLongDate(meeting.scheduledAt)}
      </time>
    </span>
  );
}

export function TimingBadge({ timing }: { timing: MeetingTiming }) {
  return (
    <span
      className={`inline-flex min-w-[82px] justify-center rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium ${timing === MeetingTiming.Upcoming ? "border-[#f97316] text-[#f97316]" : "border-[#fbe2d0] text-[#858c96]"}`}
    >
      {MEETING_TIMING_LABELS[timing]}
    </span>
  );
}

export function MeetingFiles({
  files,
  onOpen,
}: {
  files: StartupDocument[];
  onOpen: (documentId: string) => void;
}) {
  if (files.length === 0) return null;
  const hidden = files.length - VISIBLE_FILES;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {files.slice(0, VISIBLE_FILES).map((file) => (
        <button
          key={file.id}
          type="button"
          onClick={() => onOpen(file.id)}
          className="flex items-center gap-1 rounded-xl border border-[#fff4ec] px-1 py-0.5 text-xs text-[#858c96] hover:border-[#e86f22]"
        >
          <Image src="/startup/file-light.svg" alt="" width={24} height={24} />
          <span className="max-w-[140px] truncate">
            {file.originalFilename}
          </span>
        </button>
      ))}
      {hidden > 0 ? (
        <span className="text-xs text-[#858c96] underline">+{hidden}</span>
      ) : null}
    </div>
  );
}
