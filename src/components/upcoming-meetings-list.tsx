"use client";

import { CalendarDays, Video } from "lucide-react";

import type { MeetingItem } from "@/interfaces/meeting";
import { formatSlotDateTime } from "@/lib/format";

export function UpcomingMeetingsList({
  meetings,
  emptyLabel,
  isLoading,
  counterpartOf,
}: {
  meetings: MeetingItem[];
  emptyLabel: string;
  isLoading?: boolean;
  counterpartOf?: (meeting: MeetingItem) => string | undefined;
}) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#e4e7ea] bg-white">
        <p className="p-5 text-center text-xs text-[#858c96]">Yükleniyor...</p>
      </div>
    );
  }

  if (!meetings.length) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#e4e7ea] bg-white">
        <p className="p-5 text-center text-xs text-[#858c96]">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e4e7ea] bg-white">
      {meetings.map((meeting) => {
        const counterpart = counterpartOf?.(meeting);
        return (
          <article
            key={meeting.id}
            className="flex items-center gap-3 border-b border-[#eef0f2] p-4 last:border-b-0"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fdebdd] text-[#e86f22]">
              <CalendarDays className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-[#858c96]">
                {formatSlotDateTime(meeting.scheduledAt)}
                {meeting.durationMinutes
                  ? ` · ${meeting.durationMinutes} dk`
                  : ""}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold">
                {meeting.agenda ?? "Mentorluk görüşmesi"}
              </p>
              {counterpart ? (
                <p className="mt-0.5 truncate text-[11px] text-[#676e78]">
                  {counterpart}
                </p>
              ) : null}
            </div>
            {meeting.meetLink ? (
              <a
                href={meeting.meetLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#e86f22] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#ce5e19]"
              >
                <Video className="size-3.5" aria-hidden />
                Katıl
              </a>
            ) : (
              <span className="shrink-0 text-[11px] text-[#858c96]">
                Link yok
              </span>
            )}
          </article>
        );
      })}
    </div>
  );
}
