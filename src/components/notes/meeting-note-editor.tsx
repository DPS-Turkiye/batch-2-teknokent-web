"use client";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import { useDemoSession } from "@/components/providers/session-provider";
import { DocumentStatus } from "@/hooks/use-meeting-note-document";
import { useMeetingNote, useSaveMeetingNote } from "@/hooks/use-meeting-notes";
import {
  CONTRIBUTORS_KEY,
  bindMeetingNoteContributors,
  formatMeetingNoteContributors,
} from "@/lib/meeting-note-document";
import { pickPresenceColor } from "@/lib/meeting-note-presence";

const SNAPSHOT_INTERVAL_MS = 20000;

interface MeetingNoteEditorProps {
  meetingId: string;
  doc: Y.Doc;
  awareness: Awareness;
  documentStatus: DocumentStatus;
  seedFromSnapshot: boolean;
  persistFullState: () => void;
}

export function MeetingNoteEditor({
  meetingId,
  doc,
  awareness,
  documentStatus,
  seedFromSnapshot,
  persistFullState,
}: MeetingNoteEditorProps) {
  const noteQuery = useMeetingNote(meetingId);
  const saveNote = useSaveMeetingNote(meetingId);
  const session = useDemoSession();

  const presenceUser = useMemo(
    () => ({
      name: session?.fullName ?? "Misafir",
      color: pickPresenceColor(session?.userId ?? "guest"),
    }),
    [session?.fullName, session?.userId],
  );

  const [hasUnsavedSnapshot, setHasUnsavedSnapshot] = useState(false);
  const [contributorNames, setContributorNames] = useState("");
  const isDirty = useRef(false);
  const didSeed = useRef(false);
  const isSeeding = useRef(false);
  const snapshotRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: doc }),
      CollaborationCaret.configure({
        provider: { awareness },
        user: presenceUser,
      }),
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
    editor?.commands.updateUser(presenceUser);
  }, [editor, presenceUser]);

  useEffect(() => {
    const refresh = () =>
      setContributorNames(formatMeetingNoteContributors(doc));
    refresh();
    const contributors = doc.getMap<string>(CONTRIBUTORS_KEY);
    contributors.observe(refresh);
    const stop = bindMeetingNoteContributors(
      doc,
      session ? { userId: session.userId, name: session.fullName } : null,
      () => isSeeding.current,
    );
    return () => {
      contributors.unobserve(refresh);
      stop();
    };
  }, [doc, session]);

  useEffect(() => {
    if (!editor || documentStatus !== DocumentStatus.Ready) return;
    if (didSeed.current) return;
    if (seedFromSnapshot && noteQuery.isLoading) return;

    didSeed.current = true;
    if (!seedFromSnapshot) return;

    isSeeding.current = true;
    try {
      if (noteQuery.data?.content) {
        editor.commands.setContent(noteQuery.data.content);
      }
    } finally {
      isSeeding.current = false;
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
        <span className="text-xs text-[#8a8a8a]">
          {contributorNames
            ? `${statusLabel} · ${contributorNames}`
            : statusLabel}
        </span>
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
