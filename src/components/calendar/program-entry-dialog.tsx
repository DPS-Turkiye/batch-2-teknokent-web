"use client";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
import { useLocale, useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import type { MemberProgramEvent } from "@/interfaces/coordinator-program";
import { occurrenceKeys } from "@/lib/keyed-list";
import {
  programEntryKindLabel,
  programEntryLines,
  programEntryWhen,
} from "@/lib/program-calendar";

/** A program entry opened from Takvim: what it is, when, and the plan's speaker, week and place. */
export function ProgramEntryDialog({
  event,
  onClose,
}: {
  event: MemberProgramEvent;
  onClose: () => void;
}) {
  const t = useTranslations("programCalendar");
  const locale = useLocale();
  const lines = programEntryLines(event, t);
  const keys = occurrenceKeys(lines);

  return (
    <ModalDialog
      labelledBy="program-entry-title"
      onClose={onClose}
      dismissOnBackdrop
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2f8f83]">
            {programEntryKindLabel(event.kind, t)}
          </p>
          <h2
            id="program-entry-title"
            className="mt-1 text-lg font-semibold text-[#22262b]"
          >
            {event.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="text-[#a4aab2] hover:text-[#676e78]"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 rounded-xl bg-[#f8f9fa] p-4 text-xs text-[#676e78]">
        <p className="text-[#22262b]">{programEntryWhen(event, locale, t)}</p>
        {event.programName ? (
          <p>{t("program", { name: event.programName })}</p>
        ) : null}
        {lines.map((line, index) => (
          <p key={keys[index]} className="whitespace-pre-line">
            {line}
          </p>
        ))}
      </div>
    </ModalDialog>
  );
}
