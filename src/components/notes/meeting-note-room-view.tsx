"use client";

import { AppShell } from "@/components/hoc/app-shell";
import { MeetingNoteEditor } from "@/components/notes/meeting-note-editor";
import { MeetingTodoList } from "@/components/notes/meeting-todo-list";
import {
  RealtimeStatus,
  useMeetingRoomSocket,
} from "@/hooks/use-meeting-room-socket";
import { useMeetings } from "@/hooks/use-meetings";
import { formatSlotDateTime } from "@/lib/format";
import { AppArea } from "@/types/app-area";

const REALTIME_LABELS: Record<RealtimeStatus, string> = {
  [RealtimeStatus.Connecting]: "Bağlanıyor",
  [RealtimeStatus.Connected]: "Canlı",
  [RealtimeStatus.Offline]: "Bağlantı yok",
};

interface MeetingNoteRoomViewProps {
  meetingId: string;
}

export function MeetingNoteRoomView({ meetingId }: MeetingNoteRoomViewProps) {
  const realtimeStatus = useMeetingRoomSocket(meetingId);
  const meetingsQuery = useMeetings();
  const meeting = meetingsQuery.data?.find((item) => item.id === meetingId);

  return (
    <AppShell
      active={AppArea.Notes}
      backHref="/notes"
      title={meeting?.agenda ?? "Toplantı not defteri"}
      subtitle={
        meeting ? formatSlotDateTime(meeting.scheduledAt) : "Toplantı notları"
      }
      actions={
        <span className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] px-2.5 py-1 text-xs text-[#6a7282]">
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${
              realtimeStatus === RealtimeStatus.Connected
                ? "bg-[#48b787]"
                : realtimeStatus === RealtimeStatus.Connecting
                  ? "bg-[#d8855c]"
                  : "bg-[#e0645e]"
            }`}
          />
          {REALTIME_LABELS[realtimeStatus]}
        </span>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <MeetingNoteEditor meetingId={meetingId} />
        <MeetingTodoList meetingId={meetingId} />
      </div>
    </AppShell>
  );
}
