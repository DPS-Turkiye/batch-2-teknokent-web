"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { AppShell } from "@/components/hoc/app-shell";
import { MeetingAssistantSharePanel } from "@/components/notes/meeting-assistant-share-panel";
import { MeetingMentorNotesStrip } from "@/components/notes/meeting-mentor-notes-strip";
import { MeetingNoteEditor } from "@/components/notes/meeting-note-editor";
import { MeetingNoteSnapshotView } from "@/components/notes/meeting-note-snapshot-view";
import { MeetingTodoList } from "@/components/notes/meeting-todo-list";
import {
  MeetingFiles,
  MeetingPerson,
  MeetingWhen,
} from "@/components/startup/meeting-card-parts";
import { useMeetingNoteDocument } from "@/hooks/use-meeting-note-document";
import { useMeetingNotePresence } from "@/hooks/use-meeting-note-presence";
import {
  RealtimeStatus,
  useMeetingRoomSocket,
} from "@/hooks/use-meeting-room-socket";
import { useMeetings } from "@/hooks/use-meetings";
import { useMentors } from "@/hooks/use-mentors";
import {
  useOpenTodoCounts,
  useStartupMeetingNotes,
} from "@/hooks/use-startup-meeting-notes";
import {
  useOpenDocument,
  useStartupDocuments,
} from "@/hooks/use-startup-documents";
import {
  meetingTiming,
  meetingTitle,
  meetingsWithSameMentor,
  visibleMeetings,
} from "@/lib/startup-meetings";
import { AppArea } from "@/types/app-area";
import { DOCUMENT_UPLOAD_ACCEPT } from "@/lib/const";

function UploadButton({
  accept,
  disabled,
  icon,
  label,
  onFile,
}: {
  accept: string;
  disabled: boolean;
  icon: string;
  label: string;
  onFile: (file: File) => void;
}) {
  return (
    <label
      className={`flex h-8 cursor-pointer items-center gap-2 rounded-lg bg-[#e86f22] px-3 text-xs text-white ${disabled ? "opacity-60" : "hover:bg-[#ce5e19]"}`}
    >
      <Image src={icon} alt="" width={24} height={24} />
      {label}
      <input
        type="file"
        className="sr-only"
        accept={accept}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

interface MeetingNoteRoomViewProps {
  meetingId: string;
}

export function MeetingNoteRoomView({ meetingId }: MeetingNoteRoomViewProps) {
  const t = useTranslations("notes");
  const meetingsQuery = useMeetings();
  const mentorsQuery = useMentors();
  const documentsQuery = useStartupDocuments();
  const openDocument = useOpenDocument();
  const notes = useStartupMeetingNotes(meetingId);

  const meetings = useMemo(
    () => visibleMeetings(meetingsQuery.data ?? []),
    [meetingsQuery.data],
  );
  const meeting = meetings.find((item) => item.id === meetingId);
  const otherMeetings = meeting
    ? meetingsWithSameMentor(meetings, meeting)
    : [];
  const openTodos = useOpenTodoCounts(otherMeetings.map((item) => item.id));
  const title = meeting ? meetingTitle(meeting, t("untitled")) : t("untitled");
  const mentorTitle = meeting?.mentorId
    ? mentorsQuery.data?.find((mentor) => mentor.id === meeting.mentorId)
        ?.professionalTitle || null
    : null;
  const files = useMemo(
    () =>
      (documentsQuery.data ?? []).filter(
        (document) => document.meetingId === meetingId,
      ),
    [documentsQuery.data, meetingId],
  );

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

  const uploads = (
    <div className="mt-3 flex shrink-0 flex-wrap justify-end gap-3">
      <UploadButton
        accept="image/png,image/jpeg,image/webp"
        disabled={notes.isUploading}
        icon="/startup/photo-upload.svg"
        label={t("photo")}
        onFile={notes.uploadPhoto}
      />
      <UploadButton
        accept={DOCUMENT_UPLOAD_ACCEPT}
        disabled={notes.isUploading}
        icon="/startup/file-upload.svg"
        label={t("file")}
        onFile={notes.uploadFile}
      />
    </div>
  );

  return (
    <AppShell active={AppArea.Notes} menteeHome>
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-14 pt-3 sm:px-8">
        <nav
          aria-label={t("breadcrumb")}
          className="mb-5 flex items-center gap-1.5 text-sm text-[#858c96]"
        >
          <Link href="/dashboard" className="hover:text-[#e86f22]">
            {t("home")}
          </Link>
          <span aria-hidden>›</span>
          <Link href="/notes" className="hover:text-[#e86f22]">
            {t("title")}
          </Link>
          <span aria-hidden>›</span>
          <span className="truncate text-[#22262b]">{title}</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h1 className="text-xl leading-7 text-[#22262b]">{title}</h1>
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
            {t(`realtime.${realtimeStatus}`)}
          </span>
        </div>

        <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,630fr)_minmax(0,402fr)]">
          <div className="flex min-w-0 flex-col space-y-3 rounded-xl bg-white p-3">
            <MeetingAssistantSharePanel meetingId={meetingId} />

            {realtimeStatus === RealtimeStatus.Offline ? (
              <MeetingNoteSnapshotView meetingId={meetingId} footer={uploads} />
            ) : (
              <MeetingNoteEditor
                meetingId={meetingId}
                doc={noteDocument.doc}
                awareness={awareness}
                documentStatus={noteDocument.status}
                seedFromSnapshot={noteDocument.seedFromSnapshot}
                persistFullState={noteDocument.persistFullState}
                footer={uploads}
              />
            )}

            {meeting ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <MeetingPerson meeting={meeting} mentorTitle={mentorTitle} />
                <MeetingWhen
                  meeting={meeting}
                  timing={meetingTiming(meeting)}
                  dateOnly
                />
              </div>
            ) : null}
            <MeetingFiles files={files} onOpen={openDocument} />
          </div>

          <div className="lg:sticky lg:top-[120px] lg:self-start">
            <MeetingTodoList meetingId={meetingId} />
          </div>
        </div>

        <MeetingMentorNotesStrip
          meetings={otherMeetings}
          mentorTitle={mentorTitle}
          openTodos={openTodos}
        />
      </div>
    </AppShell>
  );
}
