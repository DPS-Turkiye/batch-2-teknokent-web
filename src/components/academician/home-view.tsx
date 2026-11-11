"use client";

import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CircleX,
  Repeat,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useId, type ReactNode } from "react";

import { AdviseeChip } from "@/components/academician/advisee-chip";
import { AppointmentStatusBadge } from "@/components/academician/appointment-status-badge";
import { SampleDataNotice } from "@/components/academician/sample-data-notice";
import { StudentAvatar } from "@/components/academician/student-avatar";
import { WorkspaceQueryState } from "@/components/academician/workspace-query-state";
import { Button, ButtonVariant } from "@/components/ia/button";
import { Card } from "@/components/ia/card";
import { PageHeader } from "@/components/ia/page-header";
import {
  useAcademicianHome,
  type AcademicianHome,
  type HomeAvailabilityRow,
  type HomeRequestCard,
} from "@/hooks/use-academician-home";
import { AppointmentStatus } from "@/interfaces/appointment";
import { AvailabilityItemKind } from "@/types/academician-office-hours";

export function AcademicianHomeView() {
  const { home, isLoading, error, retry, isRetrying } = useAcademicianHome();
  if (!home) {
    return (
      <WorkspaceQueryState
        isLoading={isLoading}
        error={error}
        onRetry={retry}
        isRetrying={isRetrying}
      />
    );
  }
  // Without open hours the design drops the greeting and its actions: "Müsaitlik Ekle" is the one thing to do.
  if (!home.hasAvailability) {
    return (
      <div className="space-y-8">
        <SampleDataNotice />
        <HomeWithoutAvailability home={home} />
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <HomeHeader home={home} />
      <SampleDataNotice />
      <HomeWithAvailability home={home} />
    </div>
  );
}

function HomeHeader({ home }: { home: AcademicianHome }) {
  const t = useTranslations("iaAcademician.home");
  return (
    <PageHeader
      title={home.greeting}
      actions={
        <>
          <Button variant={ButtonVariant.Secondary} href={home.links.calendar}>
            {t("editAvailability")}
          </Button>
          <Button href={home.links.appointments}>{t("appointments")}</Button>
        </>
      }
    />
  );
}

function HomeWithAvailability({ home }: { home: AcademicianHome }) {
  const t = useTranslations("iaAcademician.home");
  const { stats } = home;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label={t("stats.pending")}
          dot="bg-status-warning-icon"
          value={stats.pending.value}
          hint={stats.pending.hint}
        />
        <StatCard
          label={t("stats.today")}
          dot="bg-status-success-icon"
          value={stats.today.value}
          hint={stats.today.hint}
        />
        <StatCard
          label={t("stats.week")}
          value={stats.week.value}
          hint={stats.week.hint}
        />
        <StatCard
          label={t("stats.advisees")}
          value={stats.advisees ?? t("stats.none")}
          hint={t("stats.adviseesHint")}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PendingRequests home={home} />
        <div className="space-y-6">
          <TodayCard home={home} />
          <AvailabilityCard home={home} />
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
  dot,
  muted = false,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  dot?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        muted
          ? "border-transparent bg-background-subtle"
          : "border-border-default bg-background-surface"
      }`}
    >
      <p className="flex items-center gap-2 type-caption text-text-secondary">
        {dot ? (
          <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
        ) : null}
        {label}
      </p>
      <p className="mt-2 type-h2 text-text-primary">{value}</p>
      <p className="mt-1 type-caption text-text-muted">{hint}</p>
    </div>
  );
}

function PendingRequests({ home }: { home: AcademicianHome }) {
  const t = useTranslations("iaAcademician.home.requests");
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="type-h4 text-text-primary">
          {t("title")}
        </h2>
        {home.pendingCount > 0 ? (
          <Link
            href={home.links.requests}
            className="inline-flex items-center gap-1 type-label text-brand-odtu-strong"
          >
            {t("seeAll", { count: home.pendingCount })}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>
      {home.requests.length > 0 ? (
        <ul className="space-y-3">
          {home.requests.map((card) => (
            <li key={card.id}>
              <PendingRequestCard card={card} home={home} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-background-subtle px-5 py-4 type-body-sm text-text-secondary">
          {t("empty")}
        </p>
      )}
    </section>
  );
}

function PendingRequestCard({
  card,
  home,
}: {
  card: HomeRequestCard;
  home: AcademicianHome;
}) {
  const t = useTranslations("iaAcademician.home.requests");
  const nameId = useId();
  const busy = home.answeringId === card.id;
  return (
    <Card labelledBy={nameId} className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <StudentAvatar name={card.studentName} />
          <div>
            <p id={nameId} className="type-label text-text-primary">
              {card.studentName}
            </p>
            <p className="type-caption text-text-muted">{card.when}</p>
          </div>
        </div>
        {card.isAdvisee ? <AdviseeChip /> : null}
      </div>
      <div className="space-y-1">
        <p className="type-overline text-text-muted">{t("topic")}</p>
        <p className="type-body-sm text-text-primary">{card.topic}</p>
      </div>
      <AppointmentStatusBadge status={AppointmentStatus.Pending} />
      <div className="flex flex-wrap gap-2">
        {card.canDecline ? (
          <Button variant={ButtonVariant.Ghost} href={home.links.requests}>
            {t("decline")}
          </Button>
        ) : null}
        {card.canPropose ? (
          <Button
            variant={ButtonVariant.Secondary}
            href={home.links.requests}
            className="flex-1"
          >
            <CalendarClock aria-hidden className="size-4" />
            {t("propose")}
          </Button>
        ) : null}
        {card.acceptTime === null ? (
          <Button href={home.links.requests}>{t("accept")}</Button>
        ) : (
          <Button
            disabled={busy}
            onClick={() => {
              home.accept(card);
            }}
          >
            {t("accept")}
          </Button>
        )}
      </div>
    </Card>
  );
}

function TodayCard({ home }: { home: AcademicianHome }) {
  const t = useTranslations("iaAcademician.home.today");
  const titleId = useId();
  return (
    <Card labelledBy={titleId} compact className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="type-h4 text-text-primary">
          {t("title")}
        </h2>
        <p className="type-caption text-text-muted">
          {t("count", { count: home.today.length })}
        </p>
      </div>
      {home.today.length > 0 ? (
        <ul className="divide-y divide-border-subtle">
          {home.today.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <span className="w-12 shrink-0 type-label text-text-primary">
                {item.time}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate type-label text-text-primary">
                  {item.studentName}
                </span>
                <span className="block truncate type-caption text-text-muted">
                  {item.topic}
                </span>
              </span>
              <AppointmentStatusBadge status={AppointmentStatus.Confirmed} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="type-body-sm text-text-secondary">{t("empty")}</p>
      )}
    </Card>
  );
}

const ROW_VALUE_CLASS: Record<AvailabilityItemKind, string> = {
  [AvailabilityItemKind.Recurring]: "text-text-primary",
  [AvailabilityItemKind.OneOff]: "text-status-info-text",
  [AvailabilityItemKind.Unavailable]: "text-brand-odtu-strong",
};

function AvailabilityCard({ home }: { home: AcademicianHome }) {
  const t = useTranslations("iaAcademician.home.availability");
  const titleId = useId();
  const dayOffs = home.availability.filter(
    (row) => row.kind === AvailabilityItemKind.Unavailable,
  );
  const hours = home.availability.filter(
    (row) => row.kind !== AvailabilityItemKind.Unavailable,
  );
  return (
    <div data-tour="availability-weekly">
      <Card labelledBy={titleId} compact className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="type-h4 text-text-primary">
            {t("title")}
          </h2>
          <Link
            href={home.links.calendar}
            className="type-label text-brand-odtu-strong"
          >
            {t("edit")}
          </Link>
        </div>
        <dl className="space-y-3">
          {hours.map((row) => (
            <AvailabilityLine key={row.key} row={row} />
          ))}
        </dl>
        {dayOffs.map((row) => (
          <p
            key={row.key}
            className="rounded-xl bg-brand-odtu-bg px-3 py-2 type-caption text-brand-odtu-strong"
          >
            {row.label}
          </p>
        ))}
      </Card>
    </div>
  );
}

function AvailabilityLine({ row }: { row: HomeAvailabilityRow }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="type-body-sm text-text-secondary">{row.label}</dt>
      <dd className={`type-label ${ROW_VALUE_CLASS[row.kind]}`}>{row.hours}</dd>
    </div>
  );
}

function HomeWithoutAvailability({ home }: { home: AcademicianHome }) {
  const t = useTranslations("iaAcademician.home");
  const { stats } = home;
  return (
    <>
      <EmptyAvailability home={home} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          muted
          label={t("stats.pending")}
          value={stats.pending.value}
          hint={
            home.pendingCount > 0 ? stats.pending.hint : t("stats.pendingEmpty")
          }
        />
        <StatCard
          muted
          label={t("stats.upcoming")}
          value={stats.upcoming}
          hint={t("stats.none")}
        />
        <StatCard
          muted
          label={t("stats.advisees")}
          value={stats.advisees ?? t("stats.none")}
          hint={t("stats.adviseesHint")}
        />
      </div>
      {/* Requests sent before the hours were cleared still need an answer. */}
      {home.pendingCount > 0 ? <PendingRequests home={home} /> : null}
    </>
  );
}

const EXAMPLES: {
  kind: AvailabilityItemKind;
  icon: ReactNode;
  title: "recurringTitle" | "oneOffTitle" | "unavailableTitle";
  hint: "recurringHint" | "oneOffHint" | "unavailableHint";
}[] = [
  {
    kind: AvailabilityItemKind.Recurring,
    icon: <Repeat aria-hidden className="size-4 text-brand-odtu-strong" />,
    title: "recurringTitle",
    hint: "recurringHint",
  },
  {
    kind: AvailabilityItemKind.OneOff,
    icon: (
      <CalendarDays aria-hidden className="size-4 text-brand-odtu-strong" />
    ),
    title: "oneOffTitle",
    hint: "oneOffHint",
  },
  {
    kind: AvailabilityItemKind.Unavailable,
    icon: <CircleX aria-hidden className="size-4 text-brand-odtu-strong" />,
    title: "unavailableTitle",
    hint: "unavailableHint",
  },
];

function EmptyAvailability({ home }: { home: AcademicianHome }) {
  const t = useTranslations("iaAcademician.home.empty");
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="grid grid-cols-1 items-center gap-8 rounded-featured px-2 py-6 lg:grid-cols-[minmax(0,1fr)_440px]"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Image
            alt=""
            src="/ia/academician/availability-calendar.png"
            width={70}
            height={70}
            className="shrink-0"
          />
          <h1 id={titleId} className="type-h3 text-text-primary">
            {t("title")}
          </h1>
        </div>
        <p className="max-w-xl type-body text-text-secondary">{t("body")}</p>
        <div data-tour="availability-add" className="w-fit">
          <Button href={home.links.calendar}>{t("cta")}</Button>
        </div>
      </div>
      <ul aria-label={t("examplesLabel")} className="space-y-3">
        {EXAMPLES.map((example) => (
          <li
            key={example.kind}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              example.kind === AvailabilityItemKind.Unavailable
                ? "border-status-error-border bg-brand-odtu-bg"
                : "border-border-default bg-background-surface"
            }`}
          >
            {example.icon}
            <span>
              <span className="block type-label text-text-primary">
                {t(example.title)}
              </span>
              <span className="block type-caption text-text-muted">
                {t(example.hint)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
