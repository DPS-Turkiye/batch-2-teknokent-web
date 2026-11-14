"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import { ISKUR_FIELD_CLASS } from "@/components/student/iskur-ui";
import { FieldLabel } from "@/components/student/reports/report-fields";
import {
  PEER_ACTIVITY_TYPES,
  PeerActivityType,
} from "@/interfaces/peer-reports";
import { isEnumValue } from "@/lib/enum";
import {
  ACTIVITY_DESCRIPTION_MAX,
  ACTIVITY_TITLE_MAX,
} from "@/lib/peer-daily-report";
import type { ActivityForm } from "@/types/peer-daily-report";

/** "Görüşme dışı faaliyet ekle" (Figma 3.2.3b), opened from the day's activity list. */
export function AddActivityDialog({
  form,
  errors,
  busy,
  mentees,
  onChange,
  onClose,
  onSubmit,
}: {
  form: ActivityForm;
  /** The fields that stop the activity, once the mentor tried to add it; null before. */
  errors: {
    title: boolean;
    activityDate: boolean;
    durationMinutes: boolean;
  } | null;
  busy: boolean;
  mentees: readonly { id: string; fullName: string }[];
  onChange: (patch: Partial<ActivityForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("iaIskurReports.activity");
  return (
    <ModalDialog
      labelledBy="add-activity-title"
      onClose={onClose}
      panelClassName="w-full max-w-[560px] rounded-[28px] bg-background-surface p-7 shadow-modal outline-none"
    >
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id="add-activity-title" className="type-h3 text-text-primary">
              {t("title")}
            </h2>
            <p className="type-body-sm text-text-secondary">{t("intro")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="grid size-9 place-items-center rounded-full text-icon-default hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="activity-type" required>
            {t("type")}
          </FieldLabel>
          <select
            id="activity-type"
            className={ISKUR_FIELD_CLASS}
            value={form.type}
            onChange={(event) => {
              const type = event.target.value;
              if (isEnumValue(PeerActivityType, type)) onChange({ type });
            }}
          >
            {PEER_ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="activity-title" required>
            {t("titleLabel")}
          </FieldLabel>
          <input
            id="activity-title"
            className={ISKUR_FIELD_CLASS}
            value={form.title}
            maxLength={ACTIVITY_TITLE_MAX}
            aria-required="true"
            aria-invalid={errors?.title ?? undefined}
            aria-describedby={errors?.title ? "activity-error" : undefined}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="activity-date" required>
              {t("date")}
            </FieldLabel>
            <input
              id="activity-date"
              type="date"
              className={ISKUR_FIELD_CLASS}
              value={form.activityDate}
              aria-required="true"
              aria-invalid={errors?.activityDate ?? undefined}
              aria-describedby={
                errors?.activityDate ? "activity-error" : undefined
              }
              onChange={(event) =>
                onChange({ activityDate: event.target.value })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="activity-minutes" required>
              {t("minutes")}
            </FieldLabel>
            <input
              id="activity-minutes"
              inputMode="numeric"
              maxLength={3}
              className={ISKUR_FIELD_CLASS}
              value={form.durationMinutes}
              aria-required="true"
              aria-invalid={errors?.durationMinutes ?? undefined}
              aria-describedby={
                errors?.durationMinutes ? "activity-error" : undefined
              }
              onChange={(event) =>
                onChange({ durationMinutes: event.target.value })
              }
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="activity-mentee">{t("mentee")}</FieldLabel>
          <select
            id="activity-mentee"
            className={ISKUR_FIELD_CLASS}
            value={form.menteeId}
            onChange={(event) => onChange({ menteeId: event.target.value })}
          >
            <option value="">{t("noMentee")}</option>
            {mentees.map((mentee) => (
              <option key={mentee.id} value={mentee.id}>
                {mentee.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="activity-description">
            {t("description")}
          </FieldLabel>
          <textarea
            id="activity-description"
            className={`${ISKUR_FIELD_CLASS} min-h-20`}
            placeholder={t("descriptionPlaceholder")}
            value={form.description}
            maxLength={ACTIVITY_DESCRIPTION_MAX}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </div>
        {errors &&
        (errors.title || errors.activityDate || errors.durationMinutes) ? (
          <p
            id="activity-error"
            role="alert"
            className="type-body-sm text-status-error-text"
          >
            {t("invalid")}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button variant={ButtonVariant.Ghost} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={busy}>
            {t("submit")}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
