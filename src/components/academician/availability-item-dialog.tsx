"use client";

import { useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import type { AcademicianAvailabilityEditor } from "@/hooks/use-academician-availability-editor";
import { Weekday, WEEKDAY_ORDER } from "@/interfaces/mentor";
import { isEnumValue } from "@/lib/enum";
import { AvailabilityItemKind } from "@/types/academician-office-hours";

const FIELD =
  "h-11 w-full rounded-input border border-border-control bg-background-surface px-3 type-body-sm text-text-primary focus-visible:outline-2 focus-visible:outline-border-selected";

const KINDS = Object.values(AvailabilityItemKind);

/** Adds or edits one availability item; the fields follow its kind. */
export function AvailabilityItemDialog({
  editor,
}: {
  editor: AcademicianAvailabilityEditor;
}) {
  const t = useTranslations("iaAcademician.availability");
  const titleId = useId();
  const errorId = useId();
  const { dialog } = editor;
  if (!dialog) return null;
  return (
    <ModalDialog
      labelledBy={titleId}
      onClose={editor.closeDialog}
      overlayClassName="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-background-inverse/30 px-4 py-8"
      panelClassName="w-full max-w-[480px] rounded-featured bg-background-surface p-6 shadow-modal outline-none"
    >
      <form onSubmit={editor.submit} className="space-y-5" noValidate>
        <h2 id={titleId} className="type-h3 text-text-primary">
          {dialog.editing === null
            ? t("dialog.addTitle")
            : t("dialog.editTitle")}
        </h2>
        {dialog.chooseKind ? (
          <fieldset className="space-y-2">
            <legend className="mb-2 type-label text-text-primary">
              {t("dialog.kind")}
            </legend>
            {KINDS.map((kind) => (
              <label
                key={kind}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${
                  dialog.kind === kind
                    ? "border-border-selected bg-background-subtle"
                    : "border-border-default"
                }`}
              >
                <input
                  type="radio"
                  name={titleId}
                  checked={dialog.kind === kind}
                  onChange={() => {
                    editor.setKind(kind);
                  }}
                  className="accent-brand-odtu-strong"
                />
                <span>
                  <span className="block type-label text-text-primary">
                    {t(`cards.${kind}.title`)}
                  </span>
                  <span className="block type-caption text-text-muted">
                    {t(`cards.${kind}.hint`)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}
        <KindFields editor={editor} errorId={errorId} />
        {dialog.error === null ? null : (
          <p
            id={errorId}
            role="alert"
            className="type-caption text-status-error-text"
          >
            {dialog.error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant={ButtonVariant.Ghost} onClick={editor.closeDialog}>
            {t("dialog.cancel")}
          </Button>
          <Button type="submit" disabled={editor.isSaving}>
            {t("dialog.save")}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}

function KindFields({
  editor,
  errorId,
}: {
  editor: AcademicianAvailabilityEditor;
  errorId: string;
}) {
  const t = useTranslations("iaAcademician.availability.dialog");
  const tWeekday = useTranslations("options.weekday");
  const { dialog } = editor;
  if (!dialog) return null;
  const describedBy = dialog.error === null ? undefined : errorId;
  switch (dialog.kind) {
    case AvailabilityItemKind.Recurring: {
      const { rule } = dialog.fields;
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t("weekday")}>
            {(id) => (
              <select
                id={id}
                value={rule.dayOfWeek}
                onChange={(event) => {
                  const value = event.target.value;
                  if (isEnumValue(Weekday, value)) {
                    editor.setRule({ dayOfWeek: value });
                  }
                }}
                className={FIELD}
              >
                {WEEKDAY_ORDER.map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {tWeekday(weekday)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label={t("start")}>
            {(id) => (
              <input
                id={id}
                type="time"
                value={rule.startTime}
                aria-describedby={describedBy}
                onChange={(event) => {
                  editor.setRule({ startTime: event.target.value });
                }}
                className={FIELD}
              />
            )}
          </Field>
          <Field label={t("end")}>
            {(id) => (
              <input
                id={id}
                type="time"
                value={rule.endTime}
                aria-describedby={describedBy}
                onChange={(event) => {
                  editor.setRule({ endTime: event.target.value });
                }}
                className={FIELD}
              />
            )}
          </Field>
        </div>
      );
    }
    case AvailabilityItemKind.OneOff: {
      const { oneOff } = dialog.fields;
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t("date")}>
            {(id) => (
              <input
                id={id}
                type="date"
                value={oneOff.date}
                aria-describedby={describedBy}
                onChange={(event) => {
                  editor.setOneOff({ date: event.target.value });
                }}
                className={FIELD}
              />
            )}
          </Field>
          <Field label={t("start")}>
            {(id) => (
              <input
                id={id}
                type="time"
                value={oneOff.startTime}
                aria-describedby={describedBy}
                onChange={(event) => {
                  editor.setOneOff({ startTime: event.target.value });
                }}
                className={FIELD}
              />
            )}
          </Field>
          <Field label={t("end")}>
            {(id) => (
              <input
                id={id}
                type="time"
                value={oneOff.endTime}
                aria-describedby={describedBy}
                onChange={(event) => {
                  editor.setOneOff({ endTime: event.target.value });
                }}
                className={FIELD}
              />
            )}
          </Field>
          <div className="sm:col-span-3">
            <Field label={t("place")}>
              {(id) => (
                <input
                  id={id}
                  type="text"
                  value={oneOff.place}
                  onChange={(event) => {
                    editor.setOneOff({ place: event.target.value });
                  }}
                  className={FIELD}
                />
              )}
            </Field>
          </div>
        </div>
      );
    }
    case AvailabilityItemKind.Unavailable: {
      const { dayOff } = dialog.fields;
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("startsOn")}>
            {(id) => (
              <input
                id={id}
                type="date"
                value={dayOff.startsOn}
                aria-describedby={describedBy}
                onChange={(event) => {
                  editor.setDayOff({ startsOn: event.target.value });
                }}
                className={FIELD}
              />
            )}
          </Field>
          <Field label={t("endsOn")}>
            {(id) => (
              <input
                id={id}
                type="date"
                value={dayOff.endsOn}
                aria-describedby={describedBy}
                onChange={(event) => {
                  editor.setDayOff({ endsOn: event.target.value });
                }}
                className={FIELD}
              />
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("reason")}>
              {(id) => (
                <input
                  id={id}
                  type="text"
                  value={dayOff.reason}
                  onChange={(event) => {
                    editor.setDayOff({ reason: event.target.value });
                  }}
                  className={FIELD}
                />
              )}
            </Field>
          </div>
        </div>
      );
    }
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="type-label text-text-primary">
        {label}
      </label>
      {children(id)}
    </div>
  );
}
