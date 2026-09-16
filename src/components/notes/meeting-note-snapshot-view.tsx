"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ReactNode } from "react";

import { useMeetingNote } from "@/hooks/use-meeting-notes";

interface MeetingNoteSnapshotViewProps {
  meetingId: string;
  footer?: ReactNode;
}

export function MeetingNoteSnapshotView({
  meetingId,
  footer,
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
            "min-h-[28rem] w-full bg-transparent px-1 py-1 text-sm leading-relaxed text-[#676e78] outline-none",
        },
      },
    },
    [content],
  );

  return (
    <section className="flex min-h-[36rem] flex-1 flex-col rounded-xl border border-[#e86f22] bg-white p-3">
      <p className="mb-3 shrink-0 text-xs text-[#aeb4bc]">
        Bağlantı yok · son kayıt salt okunur. Yenileyince birlikte
        yazabilirsiniz.
      </p>

      {noteQuery.isLoading ? (
        <p className="text-sm text-[#8a8a8a]">Not yükleniyor…</p>
      ) : noteQuery.isError ? (
        <p className="text-sm text-[#9b2c2c]">Not defteri şu an açılamıyor.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EditorContent
            editor={editor}
            className="[&_.tiptap]:min-h-[28rem] [&_.ProseMirror]:min-h-[28rem]"
          />
        </div>
      )}
      {footer}
    </section>
  );
}
