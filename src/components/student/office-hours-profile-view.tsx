"use client";

import { GraduationCap, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { QueryNotice } from "@/components/admin/admin-ui";
import { Button } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { PageHeader } from "@/components/ia/page-header";
import {
  officeHoursBookingHref,
  STUDENT_OFFICE_HOURS_HREF,
  useOfficeHoursProfile,
} from "@/hooks/use-student-office-hours";
import { shortWeekday, timeLabel } from "@/lib/calendar";
import { academicianName } from "@/lib/student-office-hours";
import { formatDayMonth, initials } from "@/lib/utils";

/** Akademisyen Profili, tam sayfa (Figma 116:126). */
export function OfficeHoursProfileView({
  academicianId,
}: {
  academicianId: string;
}) {
  const t = useTranslations("iaStudent.officeHours.profile");
  const tStatus = useTranslations("appointments.status");
  const locale = useLocale();
  const profile = useOfficeHoursProfile(academicianId);
  const { academician } = profile;
  const back = { href: STUDENT_OFFICE_HOURS_HREF, label: t("back") };

  if (!academician) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("title")} back={back} />
        <QueryNotice isLoading={profile.isLoading} error={profile.error} />
        {profile.notFound ? (
          <p className="type-body-sm text-text-muted">{t("notFound")}</p>
        ) : null}
      </div>
    );
  }

  const bookHref = officeHoursBookingHref(academician.id);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} back={back} />
      <section
        aria-labelledby="office-hours-profile-name"
        className="flex flex-col gap-6 rounded-featured border border-card-featured-border bg-card-featured-bg p-8 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-7">
          <span className="grid size-[72px] shrink-0 place-items-center rounded-full bg-background-surface type-h3 text-text-accent">
            {initials(academician.fullName)}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <h2
              id="office-hours-profile-name"
              className="type-h2 text-text-primary"
            >
              {academicianName(academician)}
            </h2>
            <p className="type-body-lg text-text-secondary">
              {[academician.department, academician.faculty]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <ul className="flex flex-wrap gap-2">
              <li className="inline-flex items-center gap-1 rounded-full bg-background-surface px-3 py-1.5 type-label-sm text-text-primary">
                <GraduationCap
                  aria-hidden
                  className="size-4"
                  strokeWidth={1.5}
                />
                {t("officeHours")}
              </li>
              {academician.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-background-surface px-3 py-1.5 type-label-sm text-text-primary"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <Button href={bookHref}>{t("request")}</Button>
          <p className="type-caption text-text-secondary">
            {profile.nearest
              ? t("nearest", {
                  day: new Intl.DateTimeFormat(locale, {
                    weekday: "long",
                  }).format(new Date(profile.nearest.startsAt)),
                  time: timeLabel(profile.nearest.startsAt, locale),
                })
              : t("noSlots")}
          </p>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-6">
          {academician.about ? (
            <Card labelledBy="office-hours-about">
              <h2 id="office-hours-about" className="type-h4 text-text-primary">
                {t("about")}
              </h2>
              <p className="mt-3 type-body text-text-secondary">
                {academician.about}
              </p>
            </Card>
          ) : null}
          {academician.topics.length > 0 ? (
            <Card labelledBy="office-hours-topics">
              <h2
                id="office-hours-topics"
                className="type-h4 text-text-primary"
              >
                {t("topics")}
              </h2>
              <ul className="mt-4 grid gap-3 md:grid-cols-3">
                {academician.topics.map((topic) => (
                  <li
                    key={topic.title}
                    className="rounded-2xl bg-background-subtle px-4 py-3"
                  >
                    <p className="type-label text-text-primary">
                      {topic.title}
                    </p>
                    <p className="type-caption text-text-muted">{topic.body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {academician.courses.length > 0 ? (
            <Card labelledBy="office-hours-courses">
              <h2
                id="office-hours-courses"
                className="type-h4 text-text-primary"
              >
                {t("courses")}
              </h2>
              <ul className="mt-4 divide-y divide-border-subtle border-t border-border-subtle">
                {academician.courses.map((course) => (
                  <li key={course.code} className="flex gap-9 py-4">
                    <span className="w-20 shrink-0 type-label text-text-primary">
                      {course.code}
                    </span>
                    <span className="type-body-sm text-text-secondary">
                      {course.name}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
        <aside className="flex flex-col gap-6">
          <Card labelledBy="office-hours-info">
            <h2 id="office-hours-info" className="type-h4 text-text-primary">
              {t("info.title")}
            </h2>
            <dl className="mt-4 flex flex-col gap-4">
              {academician.place ? (
                <InfoRow label={t("info.place")}>{academician.place}</InfoRow>
              ) : null}
              <InfoRow label={t("info.duration")}>
                {t("info.minutes", { count: academician.durationMinutes })}
              </InfoRow>
              {academician.responseTime ? (
                <InfoRow label={t("info.response")}>
                  {academician.responseTime}
                </InfoRow>
              ) : null}
            </dl>
          </Card>
          <Card labelledBy="office-hours-week">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="office-hours-week" className="type-h4 text-text-primary">
                {t("thisWeek")}
              </h2>
              <Link
                href={bookHref}
                className="type-label text-text-link hover:underline"
              >
                {t("seeAll")}
              </Link>
            </div>
            {profile.thisWeek.length === 0 ? (
              <p className="mt-3 type-body-sm text-text-muted">
                {t("noSlotsThisWeek")}
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-3 gap-2">
                {profile.thisWeek.map((slot) => {
                  const start = new Date(slot.startsAt);
                  return (
                    <li
                      key={slot.startsAt}
                      className="flex flex-col items-center rounded-xl border border-border-default py-2"
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
          </Card>
          {profile.past.length > 0 ? (
            <Card labelledBy="office-hours-past">
              <h2 id="office-hours-past" className="type-h4 text-text-primary">
                {t("past")}
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {profile.past.map((item) => (
                  <li key={item.id}>
                    <p className="type-label text-text-primary">{item.topic}</p>
                    <p className="type-caption text-text-muted">
                      {`${formatDayMonth(new Date(item.startsAt), locale)} · ${tStatus(item.status)}`}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </div>
      <p className="flex items-center gap-2 type-caption text-text-muted">
        <Info aria-hidden className="size-4" strokeWidth={1.5} />
        {t("footnote")}
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
