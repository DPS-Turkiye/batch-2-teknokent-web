"use client";

import { Calendar, Check, GraduationCap, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { QueryNotice } from "@/components/admin/admin-ui";
import { Button, ButtonVariant } from "@/components/ia/button";
import { InitialsAvatar } from "@/components/student/ia/ui";
import {
  officeHoursBookingHref,
  officeHoursProfileHref,
  useStudentOfficeHours,
} from "@/hooks/use-student-office-hours";
import type {
  OfficeHoursAcademician,
  StudentOfficeHoursSlot,
} from "@/interfaces/student-office-hours";
import { shortWeekday, timeLabel, weekdayName } from "@/lib/calendar";
import { academicianName } from "@/lib/student-office-hours";

/** Office Hours (Figma 80:400): the advisor first, then every ODTÜ academician with their nearest free time. */
export function StudentOfficeHoursView() {
  const t = useTranslations("iaStudent.officeHours.list");
  const office = useStudentOfficeHours();

  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">{t("title")}</h1>
      {office.advisor ? (
        <AdvisorHero
          academician={office.advisor.academician}
          slots={office.advisor.slots}
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-64 flex-1 sm:max-w-[420px]">
          <span className="sr-only">{t("search")}</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-icon-muted"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={office.filter.query}
            onChange={(event) => office.setQuery(event.target.value)}
            placeholder={t("search")}
            className="h-12 w-full rounded-input border border-border-control bg-background-surface pr-4 pl-11 type-body text-text-primary placeholder:text-text-placeholder"
          />
        </label>
        <FilterSelect
          label={t("faculty")}
          value={office.filter.faculty}
          options={office.faculties}
          onChange={office.setFaculty}
        />
        <FilterSelect
          label={t("department")}
          value={office.filter.department}
          options={office.departments}
          onChange={office.setDepartment}
        />
        <button
          type="button"
          aria-pressed={office.filter.availableOnly}
          onClick={office.toggleAvailableOnly}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 type-label ${
            office.filter.availableOnly
              ? "border-action-accent bg-background-selected text-text-accent"
              : "border-border-default text-text-primary"
          }`}
        >
          {office.filter.availableOnly ? (
            <Check aria-hidden className="size-4" strokeWidth={1.5} />
          ) : null}
          {t("availableOnly")}
        </button>
        <p className="ml-auto type-body-sm text-text-muted">
          {t("count", { count: office.total })}
        </p>
      </div>
      <QueryNotice
        isLoading={office.isLoading || office.isLoadingSlots}
        error={office.error}
      />
      {office.isLoading || office.isLoadingSlots || office.error ? null : office
          .cards.length === 0 ? (
        <p className="rounded-card border border-dashed border-border-default p-6 type-body-sm text-text-muted">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {office.cards.map(({ academician, nearest }, index) => (
            <li key={academician.id} className="flex">
              <AcademicianCard
                academician={academician}
                nearest={nearest}
                tourAnchor={
                  !office.advisor && index === 0
                    ? "office-hours-academician"
                    : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
      <p className="type-caption text-text-muted">{t("footnote")}</p>
    </div>
  );
}

function AdvisorHero({
  academician,
  slots,
}: {
  academician: OfficeHoursAcademician;
  slots: StudentOfficeHoursSlot[];
}) {
  const t = useTranslations("iaStudent.officeHours.advisor");
  const locale = useLocale();
  return (
    <section
      aria-labelledby="office-hours-advisor"
      data-tour="office-hours-academician"
      className="grid gap-6 rounded-featured border border-card-featured-border bg-card-featured-bg p-7 lg:grid-cols-[minmax(0,1fr)_520px]"
    >
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2 type-overline text-text-accent">
          <GraduationCap aria-hidden className="size-4" strokeWidth={1.5} />
          {t("label")}
        </p>
        <div className="flex items-center gap-4">
          <InitialsAvatar name={academician.fullName} size="lg" />
          <div className="min-w-0">
            <h2 id="office-hours-advisor" className="type-h4 text-text-primary">
              {academicianName(academician)}
            </h2>
            <p className="type-body-sm text-text-secondary">
              {[academician.department, t("source")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <p className="type-caption text-text-secondary">{t("note")}</p>
      </div>
      <div className="flex flex-col gap-4">
        <p className="type-body-sm text-text-primary">{t("nearest")}</p>
        {slots.length === 0 ? (
          <p className="type-body-sm text-text-muted">{t("noSlots")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const start = new Date(slot.startsAt);
              return (
                <li
                  key={slot.startsAt}
                  className="flex flex-col items-center rounded-xl border border-border-default bg-background-surface py-2"
                >
                  <span className="type-caption text-text-secondary">
                    {`${shortWeekday(start, locale)} ${start.getDate()}`}
                  </span>
                  <span className="type-label-lg text-text-primary">
                    {timeLabel(slot.startsAt, locale)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant={ButtonVariant.Tertiary}
            href={officeHoursProfileHref(academician.id)}
            className="text-text-accent"
          >
            {t("profile")}
          </Button>
          <Button href={officeHoursBookingHref(academician.id)}>
            {t("request")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function AcademicianCard({
  academician,
  nearest,
  tourAnchor,
}: {
  academician: OfficeHoursAcademician;
  nearest: StudentOfficeHoursSlot | null;
  tourAnchor: string | undefined;
}) {
  const t = useTranslations("iaStudent.officeHours.list");
  const locale = useLocale();
  const nearestLabel = nearest
    ? t("nearest", {
        day: weekdayName(new Date(nearest.startsAt), locale),
        time: timeLabel(nearest.startsAt, locale),
      })
    : t("noSlots");
  return (
    <article
      data-tour={tourAnchor}
      className="flex w-full flex-col gap-4 rounded-card border border-border-subtle bg-background-surface p-6"
    >
      <div className="flex items-center gap-3">
        <InitialsAvatar name={academician.fullName} size="lg" />
        <div className="min-w-0">
          <h2 className="type-h4 text-text-primary">
            {academicianName(academician)}
          </h2>
          <p className="type-body-sm text-text-secondary">
            {academician.department}
          </p>
        </div>
      </div>
      <p className="flex items-center gap-1.5 type-body-sm text-text-secondary">
        <Calendar aria-hidden className="size-4" strokeWidth={1.5} />
        {nearestLabel}
      </p>
      {academician.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {academician.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-background-muted px-3 py-1.5 type-label-sm text-text-primary"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        variant={ButtonVariant.Secondary}
        href={
          nearest
            ? officeHoursBookingHref(academician.id)
            : officeHoursProfileHref(academician.id)
        }
        fullWidth
        className="mt-auto"
      >
        <Calendar aria-hidden className="size-5" strokeWidth={1.5} />
        {nearest ? t("seeSlots") : t("profile")}
      </Button>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="inline-flex">
      <span className="sr-only">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-9 rounded-full border border-border-default bg-background-surface px-3.5 type-label text-text-primary"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
