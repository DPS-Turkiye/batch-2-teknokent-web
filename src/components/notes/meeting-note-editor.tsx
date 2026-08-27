"use client";

import Collaboration from "@tiptap/extension-collaboration";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as Y from "yjs";

import { DocumentStatus } from "@/hooks/use-meeting-note-document";
import { useMeetingNote, useSaveMeetingNote } from "@/hooks/use-meeting-notes";

const SNAPSHOT_INTERVAL_MS = 20000;

interface MeetingNoteEditorProps {
  meetingId: string;
  doc: Y.Doc;
  documentStatus: DocumentStatus;
  seedFromSnapshot: boolean;
  persistFullState: () => void;
}

export function MeetingNoteEditor({
  meetingId,
  doc,
  documentStatus,
  seedFromSnapshot,
  persistFullState,
}: MeetingNoteEditorProps) {
  const noteQuery = useMeetingNote(meetingId);
  const saveNote = useSaveMeetingNote(meetingId);

  const [hasUnsavedSnapshot, setHasUnsavedSnapshot] = useState(false);
  const isDirty = useRef(false);
  const didSeed = useRef(false);
  const snapshotRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: doc }),
    ],
    immediatelyRender: false,
    editable: false,
    editorProps: {
      attributes: {
        class:
          "h-full min-h-full w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm leading-relaxed text-[#364153] outline-none focus:border-[#4f39f6]",
      },
    },
    onUpdate: () => {
      isDirty.current = true;
      setHasUnsavedSnapshot(true);
    },
  });

  useEffect(() => {
    editor?.setEditable(documentStatus === DocumentStatus.Ready);
  }, [editor, documentStatus]);

  useEffect(() => {
    if (!editor || documentStatus !== DocumentStatus.Ready) return;
    if (didSeed.current) return;
    if (seedFromSnapshot && noteQuery.isLoading) return;

    didSeed.current = true;
    if (!seedFromSnapshot) return;

    if (noteQuery.data?.content) {
      editor.commands.setContent(noteQuery.data.content);
    }
    persistFullState();
  }, [
    documentStatus,
    editor,
    noteQuery.data,
    noteQuery.isLoading,
    persistFullState,
    seedFromSnapshot,
  ]);

  const snapshot = useCallback(() => {
    if (!editor || saveNote.isPending) return;
    saveNote.mutate(
      { content: editor.getHTML() },
      { onSuccess: () => setHasUnsavedSnapshot(false) },
    );
  }, [editor, saveNote]);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    if (!editor) return;

    const timer = window.setInterval(() => {
      if (!isDirty.current) return;
      isDirty.current = false;
      snapshotRef.current();
    }, SNAPSHOT_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      if (isDirty.current) {
        isDirty.current = false;
        snapshotRef.current();
      }
    };
  }, [editor]);

  const statusLabel = saveNote.isPending
    ? "Yedekleniyor…"
    : hasUnsavedSnapshot
      ? "Yedeklenmedi"
      : "Yedeklendi";

  return (
    <section className="flex min-h-[70vh] flex-col rounded-xl border border-[#e5e7eb] bg-white p-4 lg:h-full lg:min-h-0">
      <div className="mb-3 flex shrink-0 items-center gap-3">
        <h2 className="text-sm font-semibold text-[#171717]">Not defteri</h2>
        <span className="text-xs text-[#8a8a8a]">{statusLabel}</span>
      </div>

      {documentStatus === DocumentStatus.Failed ? (
        <p className="text-sm text-[#9b2c2c]">Not defteri şu an açılamıyor.</p>
      ) : documentStatus === DocumentStatus.Loading ? (
        <p className="text-sm text-[#8a8a8a]">Not yükleniyor…</p>
      ) : (
        <EditorContent
          editor={editor}
          className="min-h-0 flex-1 overflow-y-auto [&_.tiptap]:h-full [&_.ProseMirror]:min-h-full"
        />
      )}
    </section>
  );
}
