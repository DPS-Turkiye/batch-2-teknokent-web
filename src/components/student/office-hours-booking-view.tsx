"use client";

import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { ModalDialog } from "@/components/common/modal-dialog";
import { Button, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { InlineAlert } from "@/components/ia/inline-alert";
import { PageHeader } from "@/components/ia/page-header";
import { StatusTone } from "@/components/ia/status-badge";
import { InitialsAvatar } from "@/components/student/ia/ui";
import {
  officeHoursProfileHref,
  STUDENT_OFFICE_HOURS_HREF,
  useOfficeHoursBooking,
} from "@/hooks/use-student-office-hours";
import {
  formatWeekdayDate,
  isSameDay,
  shortWeekday,
  timeLabel,
  weekdayName,
  weekRangeLabel,
} from "@/lib/calendar";
import { academicianName } from "@/lib/student-office-hours";
import { formatLongDate } from "@/lib/utils";

type Booking = ReturnType<typeof useOfficeHoursBooking>;

/** Akademisyen Profili / Saat seç (Figma 82:2) and its "Randevu talep et" modal (82:194, 82:345). */
export function OfficeHoursBookingView({
  academicianId,
}: {
  academicianId: string;
}) {
  const t = useTranslations("iaStudent.officeHours.booking");
  const booking = useOfficeHoursBooking(academicianId);
  const { academician } = booking;
  const back = { href: STUDENT_OFFICE_HOURS_HREF, label: t("back") };

  if (!academician) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("title")} back={back} />
        <QueryNotice isLoading={booking.isLoading} error={booking.error} />
        {booking.notFound ? (
          <p className="type-body-sm text-text-muted">{t("notFound")}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} back={back} />
      <div className="grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card labelledBy="booking-academician">
          <InitialsAvatar name={academician.fullName} size="lg" />
          <h2
            id="booking-academician"
            className="mt-4 type-h3 text-text-primary"
          >
            {academicianName(academician)}
          </h2>
          <p className="type-body-sm text-text-secondary">
            {[academician.department, academician.faculty]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-6 border-t border-border-subtle pt-6">
            <h3 className="type-label-lg text-text-primary">{t("info")}</h3>
            <dl className="mt-3 flex flex-col gap-3">
              <InfoRow label={t("duration")}>
                {t("minutes", { count: academician.durationMinutes })}
              </InfoRow>
              {academician.place ? (
                <InfoRow label={t("place")}>{academician.place}</InfoRow>
              ) : null}
              <InfoRow label={t("thisWeek")}>
                {t("freeCount", { count: booking.freeThisWeek })}
              </InfoRow>
            </dl>
          </div>
          {academician.tags.length > 0 ? (
            <div className="mt-6 border-t border-border-subtle pt-6">
              <h3 className="type-label-lg text-text-primary">{t("topics")}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {academician.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-background-muted px-3 py-1.5 type-label-sm text-text-primary"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Link
            href={officeHoursProfileHref(academician.id)}
            className="mt-6 inline-block type-label text-text-link hover:underline"
          >
            {t("fullProfile")}
          </Link>
        </Card>
        <SlotPicker booking={booking} />
      </div>
      {booking.formOpen && booking.selected ? (
        <RequestDialog booking={booking} />
      ) : null}
    </div>
  );
}

function SlotPicker({ booking }: { booking: Booking }) {
  const t = useTranslations("iaStudent.officeHours.booking");
  const locale = useLocale();
  const range = `${weekRangeLabel(booking.weekStart, booking.weekEnd, locale)} ${booking.weekEnd.getFullYear()}`;
  return (
    <Card labelledBy="booking-slots">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="booking-slots" className="type-h4 text-text-primary">
            {t("slotsTitle")}
          </h2>
          <p className="type-body-sm text-text-secondary">{t("slotsHint")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("previousWeek")}
            disabled={!booking.canGoBack}
            onClick={booking.previousWeek}
            className="grid size-9 place-items-center rounded-full border border-border-default text-icon-default disabled:opacity-40"
          >
            <ChevronLeft aria-hidden className="size-4" strokeWidth={1.5} />
          </button>
          <p className="type-label text-text-primary">{range}</p>
          <button
            type="button"
            aria-label={t("nextWeek")}
            onClick={booking.nextWeek}
            className="grid size-9 place-items-center rounded-full border border-border-default text-icon-default"
          >
            <ChevronRight aria-hidden className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div
        role="group"
        aria-label={t("days")}
        className="mt-6 grid grid-cols-5 gap-3"
      >
        {booking.week.map((column) => {
          const active =
            booking.day !== null &&
            isSameDay(column.day.toISOString(), booking.day.day);
          const empty = column.freeCount === 0;
          return (
            <button
              key={column.day.toISOString()}
              type="button"
              aria-pressed={active}
              disabled={empty}
              onClick={() => booking.pickDay(column.day)}
              className={`flex flex-col items-center gap-1 rounded-2xl border py-4 ${
                active
                  ? "border-action-accent bg-background-selected text-text-accent"
                  : empty
                    ? "border-border-subtle bg-background-subtle text-text-disabled"
                    : "border-border-default bg-background-surface text-text-primary"
              }`}
            >
              <span className="type-caption">
                {shortWeekday(column.day, locale)}
              </span>
              <span className="type-h3">{column.day.getDate()}</span>
              <span className="type-caption">
                {empty
                  ? t("noneThatDay")
                  : t("slotCount", { count: column.freeCount })}
              </span>
            </button>
          );
        })}
      </div>
      {booking.day ? (
        <>
          <p className="mt-6 type-label text-text-secondary">
            {formatWeekdayDate(booking.day.day, locale)}
          </p>
          <div
            role="group"
            aria-label={t("times")}
            className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5"
          >
            {booking.day.slots.map((slot) => {
              const active = booking.selected?.startsAt === slot.startsAt;
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  aria-pressed={active}
                  disabled={!slot.available}
                  onClick={() => booking.select(slot)}
                  className={`h-11 rounded-full border type-label-lg ${
                    active
                      ? "border-action-primary-bg bg-action-primary-bg text-action-primary-fg"
                      : slot.available
                        ? "border-border-default bg-background-surface text-text-primary"
                        : "border-transparent bg-background-muted text-text-disabled"
                  }`}
                >
                  {timeLabel(slot.startsAt, locale)}
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 type-caption text-text-muted">
            <Info aria-hidden className="size-4" strokeWidth={1.5} />
            {t("fadedHint")}
          </p>
        </>
      ) : booking.isLoadingSlots ? null : (
        <p className="mt-6 type-body-sm text-text-muted">{t("noneThisWeek")}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle pt-5">
        <div>
          <p className="type-caption text-text-secondary">{t("selected")}</p>
          <p className="type-label-lg text-text-primary">
            {booking.selected
              ? `${formatWeekdayDate(new Date(booking.selected.startsAt), locale)} · ${timeLabel(booking.selected.startsAt, locale)} – ${timeLabel(booking.selected.endsAt, locale)}`
              : t("nothingSelected")}
          </p>
        </div>
        <span data-tour="office-hours-continue">
          <Button disabled={!booking.selected} onClick={booking.openForm}>
            {t("continue")}
          </Button>
        </span>
      </div>
    </Card>
  );
}

function RequestDialog({ booking }: { booking: Booking }) {
  const t = useTranslations("iaStudent.officeHours.request");
  const locale = useLocale();
  const { academician, selected } = booking;
  if (!academician || !selected) return null;
  const start = new Date(selected.startsAt);
  return (
    <ModalDialog
      labelledBy="office-hours-request-title"
      onClose={booking.closeForm}
      panelClassName="w-full max-w-[560px] rounded-[28px] bg-background-surface p-7 shadow-modal outline-none"
    >
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void booking.submit();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="office-hours-request-title"
            className="type-h3 text-text-primary"
          >
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={booking.closeForm}
            aria-label={t("close")}
            className="type-h3 text-icon-default"
          >
            ×
          </button>
        </div>
        <dl className="flex flex-col gap-3 rounded-2xl bg-background-subtle px-4 py-3">
          <InfoRow label={t("academician")}>
            {academicianName(academician)}
          </InfoRow>
          <InfoRow label={t("date")}>
            {`${formatLongDate(selected.startsAt, locale)}, ${weekdayName(start, locale)}`}
          </InfoRow>
          <InfoRow label={t("time")}>
            {`${timeLabel(selected.startsAt, locale)} – ${timeLabel(selected.endsAt, locale)}`}
          </InfoRow>
        </dl>
        <Field
          id="office-hours-request-subject"
          label={t("subject")}
          hint={t("subjectHint")}
          error={booking.errors?.title ? t("subjectRequired") : null}
        >
          <input
            id="office-hours-request-subject"
            value={booking.title}
            maxLength={booking.titleMax}
            aria-required="true"
            aria-invalid={booking.errors?.title === true}
            aria-describedby="office-hours-request-subject-note"
            onChange={(event) => booking.setTitle(event.target.value)}
            placeholder={t("subjectPlaceholder")}
            className={`h-12 w-full rounded-input border px-4 type-body text-text-primary ${
              booking.errors?.title
                ? "border-status-error-icon"
                : "border-border-control"
            }`}
          />
        </Field>
        <Field
          id="office-hours-request-description"
          label={t("description")}
          hint={t("descriptionHint", {
            count: booking.description.length,
            max: booking.descriptionMax,
          })}
          error={booking.errors?.description ? t("descriptionRequired") : null}
        >
          <textarea
            id="office-hours-request-description"
            value={booking.description}
            maxLength={booking.descriptionMax}
            rows={4}
            aria-required="true"
            aria-invalid={booking.errors?.description === true}
            aria-describedby="office-hours-request-description-note"
            onChange={(event) => booking.setDescription(event.target.value)}
            className={`w-full rounded-input border px-4 py-3 type-body text-text-primary ${
              booking.errors?.description
                ? "border-status-error-icon"
                : "border-border-control"
            }`}
          />
        </Field>
        <InlineAlert tone={StatusTone.Info} title={t("approvalTitle")}>
          {t("approvalBody")}
        </InlineAlert>
        {booking.failure ? (
          <InlineAlert tone={StatusTone.Error}>{booking.failure}</InlineAlert>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button variant={ButtonVariant.Ghost} onClick={booking.closeForm}>
            {t("cancel")}
          </Button>
          <span data-tour="appointment-request-submit">
            <Button type="submit" disabled={booking.isSending}>
              {t("submit")}
            </Button>
          </span>
        </div>
      </form>
    </ModalDialog>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  error: string | null;
  children: ReactNode;
}) {
  const t = useTranslations("iaStudent.officeHours.request");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-label text-text-primary">
        {label} <span className="text-text-accent">*</span>
        <span className="sr-only">{t("required")}</span>
      </label>
      {children}
      <p
        id={`${id}-note`}
        aria-live="polite"
        className={`flex items-center gap-1.5 type-caption ${error ? "text-status-error-text" : "text-text-muted"}`}
      >
        <Info aria-hidden className="size-3.5" strokeWidth={1.5} />
        {error ?? hint}
      </p>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="type-body-sm text-text-secondary">{label}</dt>
      <dd className="text-right type-label text-text-primary">{children}</dd>
    </div>
  );
}
