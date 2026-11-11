"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import {
  TodoBlankRows,
  TodoCheckbox,
  TodoNotebook,
} from "@/components/notes/todo-notebook";
import {
  MeetingFiles,
  MeetingPerson,
  MeetingWhen,
} from "@/components/startup/meeting-card-parts";
import {
  useOpenTodoCounts,
  useStartupMeetingNotes,
} from "@/hooks/use-startup-meeting-notes";
import type { MeetingDetails } from "@/hooks/use-startup-meetings";
import type { MeetingItem } from "@/interfaces/meeting";
import { DOCUMENT_UPLOAD_ACCEPT } from "@/lib/const";
import {
  meetingNotebookHref,
  meetingTiming,
  meetingTitle,
  notePreview,
} from "@/lib/startup-meetings";

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

export function MeetingNotesPanel({
  details,
  meeting,
  onOpenFile,
  onSelectMeeting,
  otherMeetings,
}: {
  details: (meeting: MeetingItem) => MeetingDetails;
  meeting: MeetingItem;
  onOpenFile: (documentId: string) => void;
  onSelectMeeting: (meetingId: string) => void;
  otherMeetings: MeetingItem[];
}) {
  const t = useTranslations("startupMeetings");
  const tNotes = useTranslations("notes");
  const notes = useStartupMeetingNotes(meeting.id);
  const openTodos = useOpenTodoCounts(otherMeetings.map((other) => other.id));
  const { files, mentorTitle } = details(meeting);
  const preview = notePreview(notes.noteContent);
  const notebookHref = meetingNotebookHref(meeting.id);
  const title = meetingTitle(meeting, tNotes("untitled"));

  return (
    <div className="space-y-6">
      <section
        aria-label={t("notesOf", { title })}
        className="space-y-3 rounded-[24px] bg-[#fff4ec] p-6"
      >
        <h2 className="text-xl leading-7 text-[#22262b]">{title}</h2>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,630fr)_minmax(0,402fr)]">
          <div className="min-w-0 space-y-3 rounded-xl bg-white p-3">
            <div className="space-y-2.5 rounded-xl border border-[#e86f22] p-3">
              <p className="text-sm leading-5 text-[#676e78]">
                {notes.noteLoading
                  ? tNotes("loading")
                  : preview || t("noteEmpty")}{" "}
                <Link
                  href={notebookHref}
                  className="text-[#aeb4bc] hover:text-[#e86f22]"
                >
                  {t("addNote")}
                </Link>
              </p>
              <div className="flex flex-wrap justify-end gap-3">
                <UploadButton
                  accept="image/png,image/jpeg,image/webp"
                  disabled={notes.isUploading}
                  icon="/startup/photo-upload.svg"
                  label={tNotes("photo")}
                  onFile={notes.uploadPhoto}
                />
                <UploadButton
                  accept={DOCUMENT_UPLOAD_ACCEPT}
                  disabled={notes.isUploading}
                  icon="/startup/file-upload.svg"
                  label={tNotes("file")}
                  onFile={notes.uploadFile}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MeetingPerson meeting={meeting} mentorTitle={mentorTitle} />
              <MeetingWhen meeting={meeting} timing={meetingTiming(meeting)} />
            </div>
            <MeetingFiles files={files} onOpen={onOpenFile} />
            <Link
              href={notebookHref}
              className="flex items-center gap-1 rounded-xl border border-[#e86f22] p-3 text-sm text-[#858c96] hover:text-[#e86f22]"
            >
              <Image
                src="/startup/transcript.svg"
                alt=""
                width={24}
                height={24}
              />
              {t("transcript")}
            </Link>
          </div>

          <TodoNotebook
            titleId="meeting-todos-title"
            heading="h3"
            className="h-[389px]"
          >
            <ul>
              {notes.todos.map((todo) => (
                <li key={todo.id} className="border-b border-[#c2c2c2] p-3">
                  <label className="flex items-center gap-2 text-base leading-6 text-[#636e7d]">
                    <TodoCheckbox
                      checked={todo.done}
                      onChange={(done) => notes.toggleTodo(todo.id, done)}
                    />
                    <span
                      className={`min-w-0 break-words ${todo.done ? "line-through" : ""}`}
                    >
                      {todo.title}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                notes.addTodo();
              }}
              className="border-b border-[#c2c2c2] p-3"
            >
              <label className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-[18px] shrink-0 rounded-[4px] border border-[#d4d8dd]"
                />
                <input
                  value={notes.todoDraft}
                  onChange={(event) => notes.setTodoDraft(event.target.value)}
                  placeholder={tNotes("todo.add")}
                  aria-label={tNotes("todo.add")}
                  disabled={notes.isAddingTodo}
                  className="min-w-0 flex-1 bg-transparent text-base leading-6 text-[#636e7d] outline-none placeholder:text-[#aeb4bc]"
                />
              </label>
            </form>
            <TodoBlankRows used={notes.todos.length + 1} />
          </TodoNotebook>
        </div>
      </section>

      {otherMeetings.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {otherMeetings.map((other) => (
            <li key={other.id}>
              <button
                type="button"
                onClick={() => onSelectMeeting(other.id)}
                className="w-full space-y-3 rounded-xl border border-[#e4e7ea] bg-white p-3 text-left hover:border-[#fbe2d0]"
              >
                <h3 className="text-xl leading-7 text-[#858c96]">
                  {meetingTitle(other, tNotes("untitled"))}
                </h3>
                <MeetingPerson
                  meeting={other}
                  mentorTitle={details(other).mentorTitle}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <MeetingWhen meeting={other} timing={meetingTiming(other)} />
                  {openTodos.get(other.id) ? (
                    <span className="rounded-full border border-[#f97316] bg-white px-2.5 py-1 text-[11px] font-medium text-[#f97316]">
                      {t("tasksOpen")}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
