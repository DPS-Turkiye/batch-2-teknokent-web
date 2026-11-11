"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AdminIcon,
  Avatar,
  EmptyNote,
  QueryNotice,
} from "@/components/admin/admin-ui";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import type { AdminOverview, AdminProgram } from "@/interfaces/admin-overview";
import { ProgramStatus } from "@/interfaces/program";
import {
  HOME_PROGRAM_SCOPES,
  initialOpenIntervention,
  interventionRows,
  phaseLabel,
  programHealth,
  programsInScope,
  waitingProgramCount,
  type Intervention,
} from "@/lib/admin-home";
import {
  pendingMemberships,
  pendingMentors,
  unmatchedStartups,
} from "@/lib/admin-model";
import { isEnumValue } from "@/lib/enum";
import { initials } from "@/lib/utils";
import {
  HomeInterventionKind,
  HomeProgramScope,
  InterventionTone,
} from "@/types/admin-home";

export function AdminHomeView() {
  const query = useAdminOverview();
  if (!query.data) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  return <Home data={query.data} />;
}

function Home({ data }: { data: AdminOverview }) {
  const t = useTranslations("adminHome");
  const waiting = unmatchedStartups(data);
  const mentors = pendingMentors(data);
  const access = pendingMemberships(data);
  const rows = useMemo(() => interventionRows(data, t), [data, t]);
  const [openId, setOpenId] = useState<string | null>(
    initialOpenIntervention(rows),
  );

  const alerts = [
    {
      value: waiting.length,
      title: t("alerts.waitingTitle"),
      detail: waiting.length
        ? t("alerts.waitingDetail", {
            count: waitingProgramCount(waiting),
          })
        : t("alerts.waitingNone"),
      href: "/admin/mentorships/matching",
      action: t("alerts.review"),
      border: "border-[#26a4ff]",
    },
    {
      value: mentors.length,
      title: t("alerts.mentorsTitle"),
      detail: mentors.length
        ? t("alerts.mentorsDetail")
        : t("alerts.mentorsNone"),
      href: "/admin/users/mentors",
      action: t("alerts.review"),
      border: "border-[#f97316]",
    },
    {
      value: access.length,
      title: t("alerts.accessTitle"),
      detail: access.length ? t("alerts.accessDetail") : t("alerts.accessNone"),
      href: "/admin/users/mentors",
      action: t("alerts.accessAction"),
      border: "border-[#d9464b]",
    },
    {
      value: 0,
      title: t("alerts.deadlineTitle"),
      detail: t("alerts.deadlineNone"),
      href: "/admin/programs",
      action: t("alerts.openProgram"),
      border: "border-[#e9ecef]",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {alerts.map((alert) => (
          <article
            key={alert.title}
            className={`flex min-h-[141px] flex-col gap-3 rounded-3xl border bg-white px-5 py-4 ${alert.border}`}
          >
            <p className="text-[22px] font-semibold leading-none">
              {alert.value}
            </p>
            <div>
              <p className="text-[13.5px] font-medium">{alert.title}</p>
              <p className="mt-0.5 text-[12px] text-[#858c96]">
                {alert.detail}
              </p>
            </div>
            <Link href={alert.href} className="mt-auto text-[13px] font-medium">
              {alert.action}
            </Link>
          </article>
        ))}
      </section>

      <section className="space-y-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[20px] font-semibold leading-[1.3]">
            {t("interventions")}
          </h2>
          <Link
            href="/admin/mentorships/interventions"
            className="text-[13px] font-medium"
          >
            {t("allInterventions")}
          </Link>
        </div>
        <div className="rounded-3xl border border-[#e9ecef] bg-white p-2">
          {rows.length === 0 ? (
            <EmptyNote>{t("noInterventions")}</EmptyNote>
          ) : (
            rows.map((row) => (
              <InterventionRow
                key={row.id}
                row={row}
                open={openId === row.id}
                onToggle={() =>
                  setOpenId((current) => (current === row.id ? null : row.id))
                }
              />
            ))
          )}
        </div>
      </section>

      <ProgramsSection data={data} />
    </div>
  );
}

function InterventionRow({
  row,
  open,
  onToggle,
}: {
  row: Intervention;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("adminHome");
  return (
    <div className={open ? "" : "border-b border-[#f0f2f4] last:border-0"}>
      <div className="flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center lg:gap-4">
        <IconTile kind={row.kind} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium leading-[1.3]">
            {row.title}
          </p>
          {row.subtitle ? (
            <p className="mt-[3px] truncate text-[12.5px] leading-[1.3] text-[#858c96]">
              {row.subtitle}
            </p>
          ) : null}
        </div>
        <span className="flex w-[170px] shrink-0 items-center gap-2">
          <Avatar initials={initials(row.owner)} size="sm" />
          <span className="truncate text-[12.5px] text-[#676e78]">
            {row.owner}
          </span>
        </span>
        <ToneChip tone={row.tone} label={row.label} />
        {row.kind === HomeInterventionKind.Bottleneck ? (
          <OutlinePill onClick={onToggle}>{t("review")}</OutlinePill>
        ) : (
          <Link href={row.href} className={pillClass}>
            {row.action}
          </Link>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? t("closeRow") : t("openRow")}
          onClick={onToggle}
          className="grid size-[18px] shrink-0 place-items-center"
        >
          <Asset
            src={open ? "/admin/chevron-up.svg" : "/admin/chevron-down.svg"}
            className="size-[18px]"
          />
        </button>
      </div>
      {open && row.detail ? (
        <div className="flex flex-col gap-3 border-b border-[#e4e7ea] px-4 pb-4 pt-1 lg:flex-row lg:items-stretch">
          <div className="rounded-[18px] px-4 py-3.5">
            <p className="text-[11.5px] font-medium text-[#858c96]">
              {row.detail.leftTitle}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {row.detail.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-[#fff1ec] px-2.5 py-1 text-[11.5px] font-medium text-[#e0522a]"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1 rounded-[18px] border border-[#26a4ff] px-4 py-3.5">
            <p className="text-[11.5px] font-medium text-[#858c96]">
              {t("mentorPool")}
            </p>
            <p className="mt-2 flex items-center gap-2 text-[13px] font-medium">
              <Asset src="/admin/dot-blue.svg" className="size-2" />
              {row.detail.pool}
              {row.detail.demand ? (
                <span className="font-normal text-[#d9464b]">
                  {row.detail.demand}
                </span>
              ) : null}
            </p>
            {row.detail.poolNote ? (
              <p className="mt-2 text-[11.5px] text-[#858c96]">
                {row.detail.poolNote}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 rounded-[18px] border border-[#e4e7ea] px-4 py-3.5">
            <p className="text-[11.5px] font-medium text-[#858c96]">
              {t("possibleAction")}
            </p>
            <p className="mt-2 max-w-[300px] text-[12.5px] leading-[1.45]">
              {row.detail.action}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProgramsSection({ data }: { data: AdminOverview }) {
  const t = useTranslations("adminHome");
  const [scope, setScope] = useState(HomeProgramScope.All);
  const programs = programsInScope(data.programs, scope);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[16px] font-semibold leading-[1.3]">
          {t("programs")}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-full border border-[#e9ecef] bg-white py-2.5 pr-3.5 pl-4">
            <span className="text-[13px] leading-[1.3] text-[#858c96]">
              {t("scope")}
            </span>
            <select
              aria-label={t("scopeLabel")}
              value={scope}
              onChange={(event) => {
                const { value } = event.target;
                if (isEnumValue(HomeProgramScope, value)) setScope(value);
              }}
              className="appearance-none bg-transparent text-[13.5px] leading-[1.3] font-medium text-[#22262b] outline-none"
            >
              {HOME_PROGRAM_SCOPES.map((option) => (
                <option key={option} value={option}>
                  {t(`scopes.${option}`)}
                </option>
              ))}
            </select>
            <Asset src="/admin/chevron-down-sm.svg" className="size-4" />
          </label>
          <Link
            href="/admin/programs/new"
            className="inline-flex items-center justify-center rounded-full border border-[#e9ecef] bg-white px-5 py-[11px] text-[13.5px] leading-[1.3] font-medium text-[#22262b]"
          >
            {t("newProgram")}
          </Link>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-[#e9ecef] bg-white p-2">
        <div className="overflow-x-auto lg:overflow-visible">
          <div className="min-w-[880px] lg:min-w-0">
            <div
              className={`${programCols} border-b border-[#f0f2f4] px-5 py-3 text-[12px] leading-[1.3] font-medium text-[#858c96]`}
            >
              <span>{t("columns.program")}</span>
              <span>{t("columns.issues")}</span>
              <span>{t("columns.coordinator")}</span>
              <span>{t("columns.phase")}</span>
              <span>{t("columns.teamsMentors")}</span>
              <span>{t("columns.health")}</span>
              <span />
            </div>
            {programs.length === 0 ? (
              <EmptyNote>{t("noPrograms")}</EmptyNote>
            ) : (
              programs.map((program) => (
                <ProgramRow key={program.id} program={program} data={data} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgramRow({
  program,
  data,
}: {
  program: AdminProgram;
  data: AdminOverview;
}) {
  const t = useTranslations("adminHome");
  const tCommon = useTranslations("adminCommon");
  const locale = useLocale();
  const health = programHealth(program, data);
  const issues = health.red + health.amber;
  return (
    <Link
      href="/admin/programs"
      className={`${programCols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[14px] leading-[1.3] font-medium text-[#22262b]">
          {program.name}
        </span>
        <ProgramStatusChip status={program.status} />
      </span>
      <span>
        <IssueCount count={issues} />
      </span>
      <span className="flex items-center gap-2.5 text-[13px] leading-[1.3] text-[#22262b]">
        {program.coordinatorName ? (
          <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-[9px] font-semibold text-[#a8480e]">
            {initials(program.coordinatorName)}
          </span>
        ) : null}
        {program.coordinatorName ?? (
          <span className="font-medium text-[#b7791f]">
            {tCommon("unassigned")}
          </span>
        )}
      </span>
      <span className="text-[13px] leading-[1.3] text-[#676e78]">
        {phaseLabel(program, data, t, locale)}
      </span>
      <span className="text-[13px] leading-[1.3] font-medium text-[#22262b]">
        {program.startupCount} · {program.acceptedMentorCount}
      </span>
      <span>
        <HealthBar green={health.green} amber={health.amber} red={health.red} />
      </span>
      <span className="flex justify-end">
        <Asset src="/admin/chevron-right.svg" className="size-[18px]" />
      </span>
    </Link>
  );
}

const programCols =
  "grid w-full grid-cols-[minmax(0,280fr)_110fr_230fr_190fr_150fr_minmax(0,250fr)_78fr] items-center";

function IconTile({ kind }: { kind: HomeInterventionKind }) {
  if (kind === HomeInterventionKind.Bottleneck) {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#fff1ec]">
        <Asset src="/admin/group.svg" className="size-5" />
      </span>
    );
  }
  if (kind === HomeInterventionKind.Access) {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#f5f6f8]">
        <Asset src="/admin/flag.svg" className="size-5" />
      </span>
    );
  }
  return (
    <span className="relative grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#f5f6f8]">
      <Asset src="/admin/lamp.svg" className="size-5" />
      <AdminIcon
        src="/admin/pair-dots.svg"
        width={15}
        height={9}
        className="absolute top-[31px] left-[26px] z-10"
      />
    </span>
  );
}

function ToneChip({ tone, label }: { tone: InterventionTone; label: string }) {
  const { style, dot } = TONE_STYLES[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${style}`}
    >
      <Asset src={dot} className="size-1.5" />
      {label}
    </span>
  );
}

const TONE_STYLES: Record<InterventionTone, { style: string; dot: string }> = {
  [InterventionTone.Red]: {
    style: "bg-[#fdeeee] text-[#d9464b]",
    dot: "/admin/dot-red.svg",
  },
  [InterventionTone.Amber]: {
    style: "bg-[#fff6e5] text-[#b7791f]",
    dot: "/admin/dot-amber.svg",
  },
  [InterventionTone.Neutral]: {
    style: "bg-[#f5f6f8] text-[#676e78]",
    dot: "/admin/dot-gray.svg",
  },
};

function IssueCount({ count }: { count: number }) {
  const style =
    count >= 5
      ? "bg-[#fdeeee] text-[#d9464b]"
      : count >= 2
        ? "bg-[#fff6e5] text-[#b7791f]"
        : "bg-[#f5f6f8] text-[#676e78]";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium ${style}`}
    >
      {count}
    </span>
  );
}

function ProgramStatusChip({ status }: { status: AdminProgram["status"] }) {
  const t = useTranslations("adminCommon");
  const active = status === ProgramStatus.Active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium ${
        active ? "bg-[#eaf7f0] text-[#2f9e6b]" : "bg-[#f5f6f8] text-[#676e78]"
      }`}
    >
      <AdminIcon
        src={active ? "/admin/dot-success.svg" : "/admin/dot-muted.svg"}
        width={6}
        height={6}
      />
      {t(`programStatus.${status}`)}
    </span>
  );
}

function HealthBar({
  green,
  amber,
  red,
}: {
  green: number;
  amber: number;
  red: number;
}) {
  const parts = [
    { key: "green", count: green, color: "#a4e901" },
    { key: "amber", count: amber, color: "#ffab3d" },
    { key: "red", count: red, color: "#d9464b" },
  ].filter((part) => part.count > 0);
  const t = useTranslations("adminHome");
  const total = green + amber + red;
  if (total === 0) {
    return (
      <span className="text-[12.5px] text-[#aeb4bc]">{t("notStarted")}</span>
    );
  }
  const usable = 170 - (parts.length - 1) * 3;
  return (
    <span className="flex h-2 w-[170px] gap-[3px]" aria-hidden>
      {parts.map((part) => (
        <span
          key={part.key}
          className="h-2 rounded-full"
          style={{
            width: (usable * part.count) / total,
            background: part.color,
          }}
        />
      ))}
    </span>
  );
}

function Asset({ src, className }: { src: string; className: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${className}`}>
      <AdminIcon src={src} fill className="max-w-none" />
    </span>
  );
}

function OutlinePill({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={pillClass}>
      {children}
    </button>
  );
}

const pillClass =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[#e9ecef] bg-white px-3.5 text-[12.5px] font-medium text-[#22262b]";
