"use client";

import { AppShell } from "@/components/hoc/app-shell";
import { MeetingNoteEditor } from "@/components/notes/meeting-note-editor";
import { MeetingNoteSnapshotView } from "@/components/notes/meeting-note-snapshot-view";
import { MeetingTodoList } from "@/components/notes/meeting-todo-list";
import { useMeetingNoteDocument } from "@/hooks/use-meeting-note-document";
import { useMeetingNotePresence } from "@/hooks/use-meeting-note-presence";
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
  const meetingsQuery = useMeetings();
  const meeting = meetingsQuery.data?.find((item) => item.id === meetingId);

  const {
    status: realtimeStatus,
    subscribeToDocumentUpdates,
    publishDocumentUpdate,
    subscribeToPresenceUpdates,
    publishPresenceUpdate,
  } = useMeetingRoomSocket(meetingId, Boolean(meeting));

  const noteDocument = useMeetingNoteDocument(
    meetingId,
    realtimeStatus === RealtimeStatus.Connected,
    subscribeToDocumentUpdates,
    publishDocumentUpdate,
  );

  const awareness = useMeetingNotePresence(
    noteDocument.doc,
    realtimeStatus === RealtimeStatus.Connected,
    subscribeToPresenceUpdates,
    publishPresenceUpdate,
  );

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
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:px-8 lg:h-[calc(100dvh-5.5rem)] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch">
        {realtimeStatus === RealtimeStatus.Offline ? (
          <MeetingNoteSnapshotView meetingId={meetingId} />
        ) : (
          <MeetingNoteEditor
            meetingId={meetingId}
            doc={noteDocument.doc}
            awareness={awareness}
            documentStatus={noteDocument.status}
            seedFromSnapshot={noteDocument.seedFromSnapshot}
            persistFullState={noteDocument.persistFullState}
          />
        )}
        <MeetingTodoList meetingId={meetingId} />
      </div>
    </AppShell>
  );
}
