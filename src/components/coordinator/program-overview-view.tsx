"use client";

import { ArrowRight, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyNote } from "@/components/admin/admin-ui";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import { useProgramTeamsQuery } from "@/hooks/use-program-teams";
import type { CoordinatorProgramDetail } from "@/interfaces/coordinator-program";
import {
  dateTile,
  healthShares,
  overviewActions,
  ProgramTab,
} from "@/lib/coordinator-program-detail";
import {
  daysUntil,
  formatMonthRange,
  PhaseState,
  phaseStates,
} from "@/lib/coordinator-programs";
import { setupSteps } from "@/lib/program-launch";

export function ProgramOverviewView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Overview}>
      {(detail) => (
        <div className="space-y-5">
          <SetupCard detail={detail} />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="min-w-0 space-y-5">
              <PhaseCard detail={detail} />
              <HealthCard detail={detail} />
              <Actions detail={detail} />
            </div>
            <div className="space-y-5">
              <UpcomingCard detail={detail} />
              <DistributionCard detail={detail} />
            </div>
          </div>
        </div>
      )}
    </ProgramDetailFrame>
  );
}

/** "Kurulum n / 4": what a new program still needs before mentoring can start. */
function SetupCard({ detail }: { detail: CoordinatorProgramDetail }) {
  const t = useTranslations("coordinatorPrograms");
  const teams = useProgramTeamsQuery(detail.program.id);
  if (!teams.data) return null;
  const steps = setupSteps(detail, teams.data, t);
  if (!steps) return null;
  const done = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);
  return (
    <section
      aria-label={t("setup.label")}
      className="rounded-[28px] bg-[#f7f8f9] p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-[#22262b]">
            {t("setup.title", { done, total: steps.length })}
          </h2>
          <p className="text-[13px] text-[#676e78]">{t("setup.body")}</p>
        </div>
        <span
          aria-hidden
          className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-[#e9ecef]"
        >
          <span
            className="block h-full rounded-full bg-[#22262b]"
            style={{ width: `${(done / steps.length) * 100}%` }}
          />
        </span>
      </div>
      <ol className="space-y-2">
        {steps.map((step) => {
          const current = step === next;
          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 ${
                current ? "ring-1 ring-[#22262b]" : ""
              }`}
            >
              <span
                aria-hidden
                className={`grid size-6 shrink-0 place-items-center rounded-full ${
                  step.done
                    ? "bg-[#2f9e6b] text-white"
                    : "border border-[#e0e3e7]"
                }`}
              >
                {step.done ? <Check className="size-3.5" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[14px] ${
                    step.done || current ? "text-[#22262b]" : "text-[#858c96]"
                  } ${current ? "font-medium" : ""}`}
                >
                  {step.title}
                  {step.done ? (
                    <span className="sr-only">{t("setup.done")}</span>
                  ) : null}
                </span>
                <span className="block text-[12.5px] text-[#858c96]">
                  {step.detail}
                </span>
              </span>
              {step.link?.href ? (
                <Link
                  href={step.link.href}
                  className={
                    current
                      ? "rounded-full bg-[#22262b] px-3.5 py-1.5 text-[12.5px] text-white"
                      : "inline-flex items-center gap-1 text-[12.5px] text-[#22262b]"
                  }
                >
                  {step.link.label}
                  {current ? null : (
                    <ArrowRight aria-hidden className="size-3.5" />
                  )}
                </Link>
              ) : step.link ? (
                <span className="rounded-full border border-[#e9ecef] px-3.5 py-1.5 text-[12.5px] text-[#aeb4bc]">
                  {step.link.label}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Card({
  title,
  note,
  link,
  children,
}: {
  title: string;
  note?: string;
  link?: { label: string; href: string };
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#e9ecef] bg-white p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-[#22262b]">
          {title}{" "}
          {note ? (
            <span className="text-[13px] font-normal text-[#858c96]">
              {note}
            </span>
          ) : null}
        </h2>
        {link ? (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 text-[13px] text-[#22262b]"
          >
            {link.label} <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function PhaseCard({ detail }: { detail: CoordinatorProgramDetail }) {
  const t = useTranslations("coordinatorPrograms");
  const locale = useLocale();
  const program = detail.program;
  const phases = phaseStates(program);
  return (
    <Card
      title={t("overview.phaseTitle")}
      note={
        program.currentWeek && program.totalWeeks
          ? t("week", {
              current: program.currentWeek,
              total: program.totalWeeks,
            })
          : undefined
      }
      link={{ label: t("overview.calendar"), href: "/coordinator/calendar" }}
    >
      {phases.length === 0 ? (
        <p className="text-[13px] text-[#858c96]">{t("overview.noPhases")}</p>
      ) : (
        <ol
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))`,
          }}
        >
          {phases.map(({ phase, state }) => (
            <li key={phase.id} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    state === PhaseState.Upcoming
                      ? "border-[#e0e3e7] bg-white"
                      : "border-[#22262b] bg-[#22262b] text-white"
                  }`}
                >
                  {state === PhaseState.Done ? (
                    <Check className="size-3.5" />
                  ) : state === PhaseState.Current ? (
                    <span className="size-2 rounded-full bg-white" />
                  ) : null}
                </span>
                <span
                  className={`h-[2px] flex-1 ${
                    state === PhaseState.Done ? "bg-[#22262b]" : "bg-[#e9ecef]"
                  }`}
                />
              </div>
              <p
                className={`mt-2 truncate text-[13.5px] ${
                  state === PhaseState.Upcoming
                    ? "text-[#aeb4bc]"
                    : "text-[#22262b]"
                } ${state === PhaseState.Current ? "font-medium" : ""}`}
              >
                {phase.name}
                {state === PhaseState.Current ? (
                  <span className="sr-only">{t("overview.currentPhase")}</span>
                ) : null}
              </p>
              <p className="truncate text-[12px] text-[#858c96]">
                {formatMonthRange(phase.startDate, phase.endDate, locale) ||
                  "—"}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function HealthCard({ detail }: { detail: CoordinatorProgramDetail }) {
  const t = useTranslations("coordinatorPrograms.overview");
  const shares = healthShares(detail.health);
  return (
    <Card
      title={t("healthTitle")}
      note={t("healthNote", { count: shares.total })}
      link={{ label: t("mentorships"), href: "/coordinator/mentorships" }}
    >
      <div
        role="img"
        aria-label={t("healthLabel", {
          healthy: detail.health.healthy,
          followUp: detail.health.followUp,
          risky: detail.health.risky,
        })}
        className="flex h-2.5 gap-1 overflow-hidden rounded-full bg-[#f4f5f7]"
      >
        <span
          className="h-full rounded-full bg-[#9be02f]"
          style={{ width: `${shares.healthy}%` }}
        />
        <span
          className="h-full rounded-full bg-[#ffa94d]"
          style={{ width: `${shares.followUp}%` }}
        />
        <span
          className="h-full rounded-full bg-[#ff5b5b]"
          style={{ width: `${shares.risky}%` }}
        />
      </div>
      <ul className="mt-4 flex flex-wrap gap-5 text-[13px] text-[#676e78]">
        <Legend
          color="#2f9e6b"
          value={detail.health.healthy}
          label={t("healthy")}
        />
        <Legend
          color="#f0a13a"
          value={detail.health.followUp}
          label={t("followUp")}
        />
        <Legend
          color="#d9464b"
          value={detail.health.risky}
          label={t("riskyLabel")}
        />
      </ul>
      {detail.health.riskyTopics.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-[#d9464b]">
          {detail.health.riskyTopics.map((topic) => (
            <li key={topic.title}>
              {t("riskyTopic", { topic: topic.title, count: topic.teams })}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function Legend({
  color,
  value,
  label,
}: {
  color: string;
  value: number;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ background: color }}
      />
      <span className="font-semibold text-[#22262b]">{value}</span>
      {label}
    </li>
  );
}

function Actions({ detail }: { detail: CoordinatorProgramDetail }) {
  const t = useTranslations("coordinatorPrograms");
  const actions = overviewActions(detail, t);
  if (actions.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#e9ecef] bg-white">
        <EmptyNote>{t("overview.noActions")}</EmptyNote>
      </div>
    );
  }
  return (
    <ul aria-label={t("overview.waitingWork")} className="space-y-3">
      {actions.map((action) => (
        <li
          key={action.key}
          className="flex items-center gap-3 rounded-[22px] border border-[#e9ecef] bg-white px-5 py-4"
        >
          <span aria-hidden className="flex -space-x-0.5">
            {action.tone !== "blue" ? (
              <span className="size-2 rounded-full bg-[#ff6a3d]" />
            ) : null}
            {action.tone !== "orange" ? (
              <span className="size-2 rounded-full bg-[#26a4ff]" />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] text-[#22262b]">
              {action.title}
            </span>
            <span className="block text-[12.5px] text-[#858c96]">
              {action.detail}
            </span>
          </span>
          {action.target.href ? (
            <Link
              href={action.target.href}
              className="inline-flex items-center gap-1 rounded-full border border-[#e9ecef] px-3 py-1.5 text-[12.5px] text-[#22262b]"
            >
              {action.target.label}{" "}
              <ChevronRight aria-hidden className="size-3.5" />
            </Link>
          ) : (
            <span className="rounded-full border border-[#e9ecef] px-3 py-1.5 text-[12.5px] text-[#aeb4bc]">
              {action.target.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function UpcomingCard({ detail }: { detail: CoordinatorProgramDetail }) {
  const t = useTranslations("coordinatorPrograms.overview");
  const locale = useLocale();
  return (
    <Card title={t("upcomingTitle")}>
      {detail.upcomingEvents.length === 0 ? (
        <p className="text-[13px] text-[#858c96]">{t("noUpcoming")}</p>
      ) : (
        <ul className="space-y-4">
          {detail.upcomingEvents.map((event, index) => {
            const tile = dateTile(event.startsAt, locale);
            const days = daysUntil(event.startsAt);
            return (
              <li key={event.id} className="flex items-center gap-3">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-2xl text-center leading-tight ${
                    index === 0
                      ? "bg-[#fff6e5] text-[#b7791f]"
                      : "bg-[#f4f5f7] text-[#22262b]"
                  }`}
                >
                  <span>
                    <span className="block text-[15px] font-semibold">
                      {tile.day}
                    </span>
                    <span className="block text-[10px]">{tile.month}</span>
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-[#22262b]">
                    {event.title}
                  </span>
                  {event.description ? (
                    <span className="block truncate text-[12.5px] text-[#858c96]">
                      {event.description}
                    </span>
                  ) : null}
                </span>
                {index === 0 && days >= 0 ? (
                  <span className="rounded-full bg-[#fff6e5] px-2.5 py-1 text-[12px] text-[#b7791f]">
                    {days === 0 ? t("today") : t("inDays", { count: days })}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function DistributionCard({ detail }: { detail: CoordinatorProgramDetail }) {
  const teamTotal = Math.max(
    detail.teams.mentored + detail.teams.awaitingMatch,
    1,
  );
  const t = useTranslations("coordinatorPrograms.overview");
  const mentors = detail.mentors;
  const mentorTotal = Math.max(
    mentors.withCapacity + mentors.full + mentors.idle + mentors.pending,
    1,
  );
  return (
    <Card title={t("distribution")}>
      <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-medium text-[#22262b]">
        <span aria-hidden className="size-2 rounded-full bg-[#ff6a3d]" />{" "}
        {t("teams")}
      </h3>
      <Bars
        color="#ff6a3d"
        total={teamTotal}
        rows={[
          [t("mentored"), detail.teams.mentored],
          [t("awaitingMatch"), detail.teams.awaitingMatch],
        ]}
      />
      <h3 className="mt-5 mb-2 flex items-center gap-2 border-t border-[#f0f2f4] pt-5 text-[13.5px] font-medium text-[#22262b]">
        <span aria-hidden className="size-2 rounded-full bg-[#26a4ff]" />{" "}
        {t("mentors")}
      </h3>
      <Bars
        color="#26a4ff"
        total={mentorTotal}
        rows={[
          [t("withCapacity"), mentors.withCapacity],
          [t("full"), mentors.full],
          [t("idle"), mentors.idle],
          [t("pending"), mentors.pending],
        ]}
      />
    </Card>
  );
}

function Bars({
  color,
  total,
  rows,
}: {
  color: string;
  total: number;
  rows: [string, number][];
}) {
  return (
    <dl className="space-y-2.5">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[150px_1fr_28px] items-center gap-3 text-[13px]"
        >
          <dt className="text-[#676e78]">{label}</dt>
          <span className="h-2 overflow-hidden rounded-full bg-[#f4f5f7]">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(value / total) * 100}%`, background: color }}
            />
          </span>
          <dd className="text-right font-medium text-[#22262b]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
