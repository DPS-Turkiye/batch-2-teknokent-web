"use client";

import { Video, X } from "lucide-react";

import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { Program } from "@/interfaces/program";
import { formatSlotDateTime } from "@/lib/format";
import {
  describeMeetingParticipants,
  meetingCalendarTitle,
} from "@/lib/meeting-participants";

export function MeetingDetailDialog({
  meeting,
  mentorships = [],
  programs = [],
  onClose,
}: {
  meeting: MeetingItem;
  mentorships?: MentorshipRequest[];
  programs?: Program[];
  onClose: () => void;
}) {
  const participants = describeMeetingParticipants(meeting, {
    mentorships,
    programs,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Toplantı detayı"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
    >
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-[#22262b]">
            {meeting.agenda || meetingCalendarTitle(meeting)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-full text-[#858c96] hover:bg-[#f1f2f4]"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-1 text-xs text-[#676e78]">
          {formatSlotDateTime(meeting.scheduledAt)} · {meeting.durationMinutes}{" "}
          dk
        </p>

        {participants.length ? (
          <div className="mt-4 rounded-xl border border-[#e4e7ea] p-3">
            <p className="text-xs font-semibold text-[#676e78]">Katılımcılar</p>
            <ul className="mt-2 space-y-1.5">
              {participants.map((participant) => (
                <li
                  key={`${participant.label}:${participant.name}`}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="text-[11px] font-medium text-[#858c96]">
                    {participant.label}
                  </span>
                  <span className="truncate text-right text-[#22262b]">
                    {participant.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-[#e4e7ea] p-3">
          <p className="text-xs font-semibold text-[#676e78]">
            Görüşme bağlantısı
          </p>
          {meeting.meetLink ? (
            <>
              <a
                href={meeting.meetLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#e86f22] px-4 text-sm font-semibold text-white hover:bg-[#ce5e19]"
              >
                <Video className="size-4" aria-hidden />
                Google Meet’e katıl
              </a>
              <a
                href={meeting.meetLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all text-[11px] font-medium text-[#2f7ff0] underline underline-offset-2 hover:text-[#1f6fe0]"
              >
                {meeting.meetLink}
              </a>
            </>
          ) : (
            <p className="mt-2 text-xs text-[#676e78]">
              Bu toplantı için henüz bir görüşme bağlantısı yok.
            </p>
          )}
        </div>

        {meeting.notes ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-[#22262b]">
            {meeting.notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}
