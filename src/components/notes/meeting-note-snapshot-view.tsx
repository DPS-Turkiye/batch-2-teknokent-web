"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { useMeetingNote } from "@/hooks/use-meeting-notes";

interface MeetingNoteSnapshotViewProps {
  meetingId: string;
}

export function MeetingNoteSnapshotView({
  meetingId,
}: MeetingNoteSnapshotViewProps) {
  const noteQuery = useMeetingNote(meetingId);
  const content = noteQuery.data?.content ?? "";

  const editor = useEditor(
    {
      extensions: [StarterKit],
      content,
      editable: false,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "min-h-full w-full rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-4 py-3 text-sm leading-relaxed text-[#364153] outline-none",
        },
      },
    },
    [content],
  );

  return (
    <section className="flex h-[36rem] flex-col rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="mb-3 flex shrink-0 items-center gap-3">
        <h2 className="text-sm font-semibold text-[#171717]">Not defteri</h2>
        <span className="text-xs text-[#8a8a8a]">Salt okunur</span>
      </div>

      <p className="mb-3 shrink-0 rounded-lg border border-[#f0e0c9] bg-[#fdf8f2] px-3 py-2 text-xs text-[#8a5a2b]">
        Live connection could not be established. Showing the last saved note;
        refresh the page to write together.
      </p>

      {noteQuery.isLoading ? (
        <p className="text-sm text-[#8a8a8a]">Not yükleniyor…</p>
      ) : noteQuery.isError ? (
        <p className="text-sm text-[#9b2c2c]">Not defteri şu an açılamıyor.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EditorContent
            editor={editor}
            className="min-h-full [&_.tiptap]:min-h-full [&_.ProseMirror]:min-h-full"
          />
        </div>
      )}
    </section>
  );
}
