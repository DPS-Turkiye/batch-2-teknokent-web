"use client";

import { ChevronRight, Clock, MessageCircleQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { AdviseeChip } from "@/components/academician/advisee-chip";
import { StudentAvatar } from "@/components/academician/student-avatar";
import { Button, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { StatusBadge, StatusTone } from "@/components/ia/status-badge";
import type { AcademicianAppointmentsCalendar } from "@/hooks/use-academician-appointments-calendar";
import { AppointmentsFilter } from "@/types/academician-calendar";
import { AvailabilityItemKind } from "@/types/academician-office-hours";

const HOURS_CLASS: Record<AvailabilityItemKind, string> = {
  [AvailabilityItemKind.Recurring]: "text-text-primary",
  [AvailabilityItemKind.OneOff]: "text-status-info-text",
  [AvailabilityItemKind.Unavailable]: "text-brand-odtu-strong",
};

/** The right-hand column of Randevularım: what waits for the academician, for the student, and the hours. */
export function AppointmentsRail({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  return (
    <div className="space-y-5">
      <PendingCard calendar={calendar} />
      {calendar.rail.awaiting.length > 0 ? (
        <AwaitingCard calendar={calendar} />
      ) : null}
      <AvailabilityCard calendar={calendar} />
    </div>
  );
}

function PendingCard({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  const t = useTranslations("iaAcademician.appointments.rail");
  const titleId = useId();
  const { pending } = calendar.rail;
  return (
    <Card labelledBy={titleId} compact className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2
          id={titleId}
          className="flex items-center gap-2 type-h4 text-text-primary"
        >
          {t("pendingTitle")}
          <StatusBadge tone={StatusTone.Warning}>{pending.length}</StatusBadge>
        </h2>
        <button
          type="button"
          onClick={() => {
            calendar.setFilter(AppointmentsFilter.Requests);
          }}
          className="type-label text-brand-odtu-strong"
        >
          {t("all")}
        </button>
      </div>
      {pending.length > 0 ? (
        <ul className="space-y-1">
          {pending.map((request, index) => (
            <li key={request.id}>
              <button
                type="button"
                onClick={request.open}
                className={`flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected ${
                  index === 0 ? "bg-status-warning-bg" : ""
                }`}
              >
                <StudentAvatar name={request.studentName} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 type-label text-text-primary">
                    {request.studentName}
                    {request.isAdvisee ? <AdviseeChip /> : null}
                  </span>
                  <span className="block type-caption text-text-muted">
                    {`${request.topic} · ${request.when}`}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-icon-muted"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body-sm text-text-secondary">{t("pendingEmpty")}</p>
      )}
      <p className="type-caption text-text-muted">{t("hint")}</p>
    </Card>
  );
}

function AwaitingCard({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  const t = useTranslations("iaAcademician.appointments.rail");
  const titleId = useId();
  return (
    <Card labelledBy={titleId} compact className="space-y-3">
      <h2 id={titleId} className="type-h4 text-text-primary">
        {t("awaitingTitle")}
      </h2>
      <ul className="space-y-3">
        {calendar.rail.awaiting.map((request) => (
          <li key={request.id}>
            <button
              type="button"
              onClick={request.open}
              className="flex w-full flex-col items-start gap-2 rounded-xl p-1 text-left hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-border-selected"
            >
              <span className="flex items-center gap-3">
                <StudentAvatar name={request.studentName} />
                <span>
                  <span className="block type-label text-text-primary">
                    {request.studentName}
                  </span>
                  <span className="block type-caption text-text-muted">
                    {request.proposedWhen === null
                      ? t("asked")
                      : t("proposed", { when: request.proposedWhen })}
                  </span>
                </span>
              </span>
              {request.proposedWhen === null ? (
                <StatusBadge
                  tone={StatusTone.Info}
                  icon={
                    <MessageCircleQuestion aria-hidden className="size-3.5" />
                  }
                >
                  {t("askedBadge")}
                </StatusBadge>
              ) : (
                <StatusBadge
                  tone={StatusTone.Info}
                  icon={<Clock aria-hidden className="size-3.5" />}
                >
                  {t("proposedBadge")}
                </StatusBadge>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AvailabilityCard({
  calendar,
}: {
  calendar: AcademicianAppointmentsCalendar;
}) {
  const t = useTranslations("iaAcademician.appointments");
  const titleId = useId();
  const rows = calendar.rail.availability;
  return (
    <Card labelledBy={titleId} compact className="space-y-3">
      <h2 id={titleId} className="type-h4 text-text-primary">
        {t("rail.availabilityTitle")}
      </h2>
      {rows.length > 0 ? (
        <dl className="space-y-2.5">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3"
            >
              <dt className="type-body-sm text-text-secondary">{row.label}</dt>
              <dd className={`type-label ${HOURS_CLASS[row.kind]}`}>
                {row.hours}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="type-body-sm text-text-secondary">
          {t("rail.availabilityEmpty")}
        </p>
      )}
      <Button
        variant={ButtonVariant.Secondary}
        href={calendar.links.calendar}
        fullWidth
      >
        {t("editAvailability")}
      </Button>
    </Card>
  );
}
