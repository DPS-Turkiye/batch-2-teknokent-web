"use client";

import { useQuery } from "@tanstack/react-query";
import { Video, X } from "lucide-react";
import { useMemo, useState } from "react";

import { SyncMeetingActions } from "@/components/calendar/sync-meeting-actions";
import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { Program } from "@/interfaces/program";
import { getMeetingRoom } from "@/lib/client/meetings";
import { formatSlotDateTime } from "@/lib/format";
import {
  describeMeetingParticipants,
  meetingCalendarTitle,
} from "@/lib/meeting-participants";
import {
  unusedMeetingTargets,
  unusedProgramMentors,
  type MeetingTarget,
} from "@/lib/meeting-targets";

export function MeetingDetailDialog({
  meeting,
  peers = [],
  mentorships = [],
  programs = [],
  onClose,
  onAddStartup,
  onAddMentor,
  onDelete,
  isBusy = false,
  error,
}: {
  meeting: MeetingItem;
  peers?: MeetingItem[];
  mentorships?: MentorshipRequest[];
  programs?: Program[];
  onClose: () => void;
  onAddStartup?: (target: MeetingTarget) => Promise<void>;
  onAddMentor?: (mentorId: string, organizationIds: string[]) => Promise<void>;
  onDelete?: () => Promise<void>;
  isBusy?: boolean;
  error?: Error | null;
}) {
  const roomQuery = useQuery({
    queryKey: ["meeting-room", meeting.id],
    queryFn: () => getMeetingRoom(meeting.id),
    retry: false,
  });
  const room = useMemo(() => {
    if (roomQuery.data && roomQuery.data.length > 0) {
      return roomQuery.data;
    }
    if (peers.length) {
      return peers;
    }
    return [meeting];
  }, [meeting, peers, roomQuery.data]);
  const participants = describeMeetingParticipants(meeting, {
    mentorships,
    programs,
    peers: room,
  });
  const startups = useMemo(
    () =>
      unusedMeetingTargets(
        mentorships,
        programs,
        room.map((peer) => peer.organizationId),
      ),
    [mentorships, programs, room],
  );
  const mentors = useMemo(
    () =>
      unusedProgramMentors(
        programs,
        room.map((peer) => peer.mentorId).filter(Boolean) as string[],
      ),
    [programs, room],
  );
  const startupOptions = [
    ...startups.ungrouped,
    ...startups.byProgram.flatMap((group) => group.items),
  ];
  const [startupKey, setStartupKey] = useState("");
  const [mentorId, setMentorId] = useState("");
  const canEdit = Boolean(onAddStartup && onAddMentor && onDelete);

  async function addStartup() {
    const target = startupOptions.find((item) => item.key === startupKey);
    if (!target || !onAddStartup) return;
    await onAddStartup(target);
    setStartupKey("");
  }

  async function addMentor() {
    if (!mentorId || !onAddMentor) return;
    const organizationIds = [
      ...new Set(room.map((peer) => peer.organizationId)),
    ];
    await onAddMentor(mentorId, organizationIds);
    setMentorId("");
  }

  async function removeMeeting() {
    if (!onDelete) return;
    if (
      !window.confirm(
        "Bu toplantı tüm katılımcıların takviminden silinir. Devam edilsin mi?",
      )
    ) {
      return;
    }
    await onDelete();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Toplantı detayı"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
    >
      <div className="max-h-[94vh] w-full max-w-[480px] overflow-y-auto rounded-2xl bg-white p-5 shadow-lg">
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

        {canEdit ? (
          <div className="mt-4 space-y-3 rounded-xl border border-[#e4e7ea] p-3">
            <p className="text-xs font-semibold text-[#676e78]">
              Katılımcı ekle
            </p>
            <div className="flex gap-2">
              <select
                aria-label="Startup ekle"
                value={startupKey}
                disabled={isBusy || startupOptions.length === 0}
                onChange={(event) => setStartupKey(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[#e4e7ea] px-2 py-2 text-sm text-[#22262b]"
              >
                <option value="">
                  {startupOptions.length
                    ? "Startup seç"
                    : "Eklenecek startup yok"}
                </option>
                {startups.ungrouped.map((target) => (
                  <option key={target.key} value={target.key}>
                    {target.organizationName}
                  </option>
                ))}
                {startups.byProgram.map((group) => (
                  <optgroup key={group.program.id} label={group.program.name}>
                    {group.items.map((target) => (
                      <option key={target.key} value={target.key}>
                        {target.organizationName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                type="button"
                disabled={isBusy || !startupKey}
                onClick={() => void addStartup()}
                className="rounded-lg bg-[#e86f22] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Ekle
              </button>
            </div>
            <div className="flex gap-2">
              <select
                aria-label="Mentör ekle"
                value={mentorId}
                disabled={isBusy || mentors.length === 0}
                onChange={(event) => setMentorId(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[#e4e7ea] px-2 py-2 text-sm text-[#22262b]"
              >
                <option value="">
                  {mentors.length ? "Mentör seç" : "Eklenecek mentör yok"}
                </option>
                {mentors.map((mentor) => (
                  <option key={mentor.mentorId} value={mentor.mentorId}>
                    {mentor.fullName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isBusy || !mentorId}
                onClick={() => void addMentor()}
                className="rounded-lg bg-[#e86f22] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Ekle
              </button>
            </div>
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

        <div className="mt-4">
          <SyncMeetingActions meeting={meeting} />
        </div>

        {meeting.notes ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-[#22262b]">
            {meeting.notes}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-[#fdeaea] px-3 py-2 text-xs text-[#b42318]"
          >
            {error.message}
          </p>
        ) : null}

        {onDelete ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void removeMeeting()}
            className="mt-4 w-full rounded-xl border border-[#f0b4ae] px-4 py-2.5 text-sm font-semibold text-[#b42318] hover:bg-[#fdeaea] disabled:opacity-60"
          >
            Toplantıyı sil
          </button>
        ) : null}
      </div>
    </div>
  );
}
