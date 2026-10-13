"use client";

import { useTranslations } from "next-intl";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import { useAppSession } from "@/components/providers/session-provider";
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
  footer?: ReactNode;
}

export function MeetingNoteEditor({
  meetingId,
  doc,
  awareness,
  documentStatus,
  seedFromSnapshot,
  persistFullState,
  footer,
}: MeetingNoteEditorProps) {
  const t = useTranslations("notes");
  const noteQuery = useMeetingNote(meetingId);
  const saveNote = useSaveMeetingNote(meetingId);
  const session = useAppSession();

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
          "min-h-[28rem] w-full bg-transparent px-1 py-1 text-sm leading-relaxed text-[#676e78] outline-none",
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
    ? t("saving")
    : hasUnsavedSnapshot
      ? t("unsaved")
      : t("saved");

  return (
    <section className="flex min-h-[36rem] flex-1 flex-col rounded-xl border border-[#e86f22] bg-white p-3">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <span className="text-xs text-[#aeb4bc]">
          {contributorNames
            ? `${statusLabel} · ${contributorNames}`
            : statusLabel}
        </span>
      </div>

      {documentStatus === DocumentStatus.Failed ? (
        <p className="text-sm text-[#9b2c2c]">{t("failed")}</p>
      ) : documentStatus === DocumentStatus.Loading ? (
        <p className="text-sm text-[#8a8a8a]">{t("loading")}</p>
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
