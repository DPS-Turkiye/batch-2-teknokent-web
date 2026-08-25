"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMeetingNote, useSaveMeetingNote } from "@/hooks/use-meeting-notes";
import { ClientApiError } from "@/lib/client/api";

const AUTOSAVE_DELAY_MS = 1200;

interface MeetingNoteEditorProps {
  meetingId: string;
}

export function MeetingNoteEditor({ meetingId }: MeetingNoteEditorProps) {
  const noteQuery = useMeetingNote(meetingId);
  const saveNote = useSaveMeetingNote(meetingId);

  const [isDirty, setIsDirty] = useState(false);
  const [wasRejected, setWasRejected] = useState(false);
  const baseVersion = useRef<number | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] w-full rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-sm leading-relaxed text-[#364153] outline-none focus:border-[#4f39f6]",
      },
    },
    onUpdate: () => {
      setIsDirty(true);
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(
        () => saveRef.current(),
        AUTOSAVE_DELAY_MS,
      );
    },
  });

  const note = noteQuery.data;

  const adoptServerContent = useCallback(() => {
    if (!editor || !note) return;
    baseVersion.current = note.version;
    editor.commands.setContent(note.content || "", { emitUpdate: false });
    setIsDirty(false);
    setWasRejected(false);
  }, [editor, note]);

  useEffect(() => {
    if (!editor || !note || isDirty) return;
    if (note.version === baseVersion.current) return;
    baseVersion.current = note.version;
    editor.commands.setContent(note.content || "", { emitUpdate: false });
  }, [editor, note, isDirty]);

  const save = useCallback(() => {
    if (!editor || baseVersion.current === null || saveNote.isPending) return;
    saveNote.mutate(
      { content: editor.getHTML(), version: baseVersion.current },
      {
        onSuccess: (saved) => {
          baseVersion.current = saved.version;
          setIsDirty(false);
          setWasRejected(false);
        },
        onError: (error) => {
          if (error instanceof ClientApiError && error.status === 409) {
            setWasRejected(true);
          }
        },
      },
    );
  }, [editor, saveNote]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(
    () => () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    },
    [],
  );

  const statusLabel = saveNote.isPending
    ? "Kaydediliyor…"
    : isDirty
      ? "Kaydedilmedi"
      : note?.updatedByName
        ? `Son kaydeden: ${note.updatedByName}`
        : "Kaydedildi";

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-[#171717]">Not defteri</h2>
        <span className="text-xs text-[#8a8a8a]">{statusLabel}</span>
        <button
          type="button"
          onClick={save}
          disabled={!isDirty || saveNote.isPending}
          className="ml-auto rounded-md bg-[#4f39f6] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          Kaydet
        </button>
      </div>

      {wasRejected ? (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-[#f0c9c9] bg-[#fdf2f2] px-3 py-2">
          <p className="text-xs text-[#9b2c2c]">
            Bu notu aynı anda başka biri güncelledi. Kendi yazdıklarını
            kopyalayıp güncel sürümü alabilirsin.
          </p>
          <button
            type="button"
            onClick={adoptServerContent}
            className="ml-auto shrink-0 rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#364153]"
          >
            Güncel sürümü al
          </button>
        </div>
      ) : null}

      {noteQuery.isLoading ? (
        <p className="text-sm text-[#8a8a8a]">Not yükleniyor…</p>
      ) : noteQuery.isError ? (
        <p className="text-sm text-[#9b2c2c]">Not defteri şu an açılamıyor.</p>
      ) : (
        <EditorContent editor={editor} />
      )}
    </section>
  );
}
