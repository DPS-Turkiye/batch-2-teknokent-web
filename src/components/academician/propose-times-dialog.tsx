"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import { InlineAlert } from "@/components/ia/inline-alert";
import { StatusTone } from "@/components/ia/status-badge";
import { useProposeTimes } from "@/hooks/use-propose-times";
import type { OfficeHoursRequest } from "@/interfaces/academician-office-hours";
import type { CalendarSource } from "@/lib/academician-calendar";

const CHIP =
  "rounded-2xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-selected disabled:cursor-not-allowed";

export function ProposeTimesDialog({
  request,
  source,
  now,
  onDone,
  onCancel,
}: {
  request: OfficeHoursRequest;
  source: CalendarSource;
  now: Date;
  onDone: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("iaAcademician.propose");
  const tCommon = useTranslations("iaAcademician.common");
  const propose = useProposeTimes(request, { source, now, onDone });
  const titleId = useId();
  const noteId = useId();
  const slotsId = useId();

  return (
    <ModalDialog
      labelledBy={titleId}
      onClose={onCancel}
      overlayClassName="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-background-inverse/30 px-4 py-8"
      panelClassName="w-full max-w-[560px] space-y-5 rounded-featured bg-background-surface p-6 shadow-modal outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={titleId} className="type-h3 text-text-primary">
            {t("title")}
          </h2>
          <p className="type-caption text-text-muted">{propose.requested}</p>
        </div>
        <button
          type="button"
          aria-label={tCommon("close")}
          onClick={onCancel}
          className="grid size-8 place-items-center rounded-lg text-icon-default hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      <div
        role="group"
        aria-label={t("daysLabel")}
        className="grid grid-cols-5 gap-2"
      >
        {propose.days.map((day) => (
          <button
            key={day.key}
            type="button"
            aria-pressed={day.current}
            disabled={!day.open}
            onClick={day.select}
            className={`${CHIP} flex flex-col items-center py-2 ${
              day.current
                ? "border-background-inverse bg-background-inverse text-text-inverse"
                : "border-border-default bg-background-surface text-text-primary disabled:bg-background-subtle disabled:text-text-disabled"
            }`}
          >
            <span className="type-caption">{day.weekday}</span>
            <span className="type-label-lg">{day.dayNumber}</span>
          </button>
        ))}
      </div>

      {propose.dayHeading === null ? null : (
        <div className="space-y-3">
          <p id={slotsId} className="type-caption text-text-muted">
            {propose.dayHeading}
          </p>
          <div
            role="group"
            aria-labelledby={slotsId}
            className="grid grid-cols-4 gap-2"
          >
            {propose.slots.map((slot) => (
              <button
                key={slot.key}
                type="button"
                aria-pressed={slot.picked}
                disabled={slot.taken}
                onClick={slot.toggle}
                className={`${CHIP} h-11 type-label ${
                  slot.picked
                    ? "border-brand-odtu-strong bg-brand-odtu-strong text-text-inverse"
                    : "border-border-default bg-background-surface text-text-primary disabled:border-transparent disabled:bg-background-muted disabled:text-text-disabled"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {propose.picked.length > 0 ? (
        <div className="space-y-2">
          <p className="type-caption text-text-muted">
            {t("picked", { count: propose.picked.length, max: propose.max })}
          </p>
          <ul className="flex flex-wrap gap-2">
            {propose.picked.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={item.remove}
                  aria-label={t("remove", { time: item.label })}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-odtu-bg px-3 type-label-sm text-brand-odtu-strong focus-visible:outline-2 focus-visible:outline-border-selected"
                >
                  {item.label}
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {propose.limitReached ? (
        <p role="status" className="type-caption text-status-warning-text">
          {t("limit", { max: propose.max })}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={noteId} className="type-label text-text-primary">
          {t("note")}
        </label>
        <textarea
          id={noteId}
          value={propose.note}
          onChange={(event) => {
            propose.setNote(event.target.value);
          }}
          rows={3}
          className="w-full rounded-input border border-border-control px-4 py-3 type-body-sm text-text-primary focus-visible:outline-2 focus-visible:outline-border-selected"
        />
      </div>

      <InlineAlert tone={StatusTone.Info} title={t("infoTitle")}>
        {t("infoBody")}
      </InlineAlert>

      <div className="flex justify-end gap-2">
        <Button variant={ButtonVariant.Ghost} onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button disabled={!propose.canSend} onClick={propose.send}>
          {t("send")}
        </Button>
      </div>
    </ModalDialog>
  );
}
