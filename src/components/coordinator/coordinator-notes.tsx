"use client";

import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  MAX_COORDINATOR_NOTE,
  type CoordinatorNotes,
} from "@/hooks/use-coordinator-notes";
import { formatDateTime } from "@/lib/utils";

/** The drawer's "Koordinatör notları": the composer and the notes, newest first. Coordinators only. */
export function CoordinatorNotesSection({
  notes,
}: {
  notes: CoordinatorNotes;
}) {
  const t = useTranslations("coordinatorNotes");
  const locale = useLocale();
  return (
    <div className="space-y-3">
      {notes.composing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            notes.save();
          }}
          className="space-y-2"
        >
          <textarea
            autoFocus
            value={notes.draft}
            onChange={(event) => notes.setDraft(event.target.value)}
            maxLength={MAX_COORDINATOR_NOTE}
            rows={3}
            aria-label={t("label")}
            placeholder={t("placeholder")}
            className="w-full rounded-2xl border border-[#e9ecef] px-4 py-3 text-[13px] outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!notes.canSave}
              className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white disabled:bg-[#858c96]"
            >
              {t("save")}
            </button>
            <button
              type="button"
              onClick={notes.closeComposer}
              className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-[#676e78]"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      ) : null}
      {notes.error ? (
        <p className="text-[12px] text-[#d9464b]">{notes.error.message}</p>
      ) : null}
      {notes.notes.length ? (
        <ul className="space-y-2">
          {notes.notes.map((note) => (
            <li
              key={note.id}
              className="rounded-2xl bg-[#f7f8f9] px-4 py-3 text-[13px] text-[#22262b]"
            >
              <p className="whitespace-pre-wrap">{note.body}</p>
              <p className="mt-1 flex items-center justify-between gap-2 text-[11.5px] text-[#858c96]">
                <span>
                  {note.authorName ?? t("authorFallback")} ·{" "}
                  {formatDateTime(note.createdAt, locale)}
                </span>
                {note.mine ? (
                  <button
                    type="button"
                    onClick={() => notes.remove(note.id)}
                    aria-label={t("delete")}
                    className="text-[#aeb4bc] hover:text-[#d9464b]"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                  </button>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      ) : notes.composing ? null : (
        <p className="text-[12.5px] text-[#858c96]">{t("empty")}</p>
      )}
    </div>
  );
}
