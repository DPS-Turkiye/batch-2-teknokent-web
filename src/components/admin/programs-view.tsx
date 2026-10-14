"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  activeMentorshipFor,
  needsAttention,
} from "@/components/admin/admin-model";
import {
  AdminIcon,
  EmptyNote,
  OutlineButton,
  QueryNotice,
} from "@/components/admin/admin-ui";
import { AssignCoordinatorDialog } from "@/components/admin/assign-coordinator-dialog";
import { useToast } from "@/components/providers/toast-provider";
import {
  ADMIN_OVERVIEW_QUERY_KEY,
  useAdminOverview,
} from "@/hooks/use-admin-overview";
import type { AdminOverview, AdminProgram } from "@/interfaces/admin-overview";
import { ProgramStatus } from "@/interfaces/program";
import { programCoordinatorLabel } from "@/lib/admin-coordinators";
import { createProgram } from "@/lib/client/programs";
import { initials } from "@/lib/utils";

enum Filter {
  All = "ALL",
  Active = "ACTIVE",
  Upcoming = "UPCOMING",
  Completed = "COMPLETED",
}

enum Sort {
  Issues = "ISSUES",
  Teams = "TEAMS",
  Name = "NAME",
}

export function ProgramsView() {
  const t = useTranslations("adminPrograms");
  const unassigned = useTranslations("adminCommon")("unassigned");
  const query = useAdminOverview();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filter, setFilter] = useState(Filter.All);
  const [coordinator, setCoordinator] = useState("");
  const [sort, setSort] = useState(Sort.Issues);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const create = useMutation({
    mutationFn: createProgram,
    onSuccess: async (program) => {
      setName("");
      setCreating(false);
      await queryClient.invalidateQueries({
        queryKey: ADMIN_OVERVIEW_QUERY_KEY,
      });
      showToast({
        message: t("created", { name: program.name }),
        tone: "success",
      });
    },
    onError: (error) => {
      showToast({
        message: error instanceof Error ? error.message : t("createFailed"),
        tone: "error",
      });
    },
  });

  const data = query.data;
  const rows = useMemo(() => {
    if (!data) return [];
    const filtered = data.programs.filter((program) => {
      if (filter === Filter.Active && program.status !== ProgramStatus.Active)
        return false;
      if (
        filter === Filter.Completed &&
        program.status !== ProgramStatus.Completed
      )
        return false;
      if (filter === Filter.Upcoming) return false;
      if (
        coordinator &&
        programCoordinatorLabel(program, unassigned) !== coordinator
      )
        return false;
      return program.name
        .toLocaleLowerCase("tr")
        .includes(search.toLocaleLowerCase("tr"));
    });
    return filtered.sort((left, right) => {
      if (sort === Sort.Teams) return right.startupCount - left.startupCount;
      if (sort === Sort.Name) return left.name.localeCompare(right.name, "tr");
      return issueCount(right, data) - issueCount(left, data);
    });
  }, [coordinator, data, filter, search, sort, unassigned]);

  if (!data) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }

  const counts: Record<Filter, number> = {
    [Filter.All]: data.programs.length,
    [Filter.Active]: data.programs.filter(
      (item) => item.status === ProgramStatus.Active,
    ).length,
    [Filter.Upcoming]: 0,
    [Filter.Completed]: data.programs.filter(
      (item) => item.status === ProgramStatus.Completed,
    ).length,
  };
  const coordinators = [
    ...new Set(
      data.programs.map((program) =>
        programCoordinatorLabel(program, unassigned),
      ),
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex w-max gap-1 rounded-full bg-[#f5f6f8] p-1">
          {Object.values(Filter).map((id) => {
            const selected = id === filter;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[13px] leading-[1.3] ${
                  selected
                    ? "bg-white font-medium text-[#22262b] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    : "text-[#676e78]"
                }`}
              >
                {t(`filters.${id}`)}
                <span className="text-[12px] font-medium text-[#858c96]">
                  {counts[id]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
          <label className="flex h-[42px] w-[240px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4">
            <Asset src="/admin/search.svg" className="size-[18px]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("search")}
              className="w-full bg-transparent text-[13.5px] text-[#22262b] outline-none placeholder:text-[#aeb4bc]"
            />
          </label>
          <SelectPill
            label={t("coordinator")}
            value={coordinator}
            onChange={setCoordinator}
            options={[
              { value: "", label: t("all") },
              ...coordinators.map((name) => ({ value: name, label: name })),
            ]}
          />
          <SelectPill
            label={t("sortBy")}
            value={sort}
            onChange={(value) => setSort(value as Sort)}
            options={Object.values(Sort).map((value) => ({
              value,
              label: t(`sorts.${value}`),
            }))}
          />
          {creating ? (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim()) create.mutate(name.trim());
              }}
            >
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("programName")}
                className="h-[42px] rounded-full border border-[#e9ecef] px-4 text-[13px] outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] font-medium text-white"
              >
                {t("save")}
              </button>
              <OutlineButton onClick={() => setCreating(false)}>
                {t("cancel")}
              </OutlineButton>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] leading-[1.3] font-medium text-white"
            >
              {t("newProgram")}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e9ecef] bg-white p-2">
        <div className="overflow-x-auto lg:overflow-visible">
          <div className="min-w-[980px] lg:min-w-0">
            <div
              className={`${cols} border-b border-[#f0f2f4] px-5 py-3 text-[12px] leading-[1.3] font-medium text-[#858c96]`}
            >
              <span>{t("columns.program")}</span>
              <span>{t("columns.issues")}</span>
              <span>{t("columns.coordinator")}</span>
              <span>{t("columns.datePhase")}</span>
              <span>{t("columns.teams")}</span>
              <span>{t("columns.mentors")}</span>
              <span>{t("columns.health")}</span>
              <span />
            </div>
            {rows.length === 0 ? (
              <EmptyNote>{t("empty")}</EmptyNote>
            ) : (
              rows.map((program) => (
                <ProgramRow key={program.id} program={program} data={data} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramRow({
  program,
  data,
}: {
  program: AdminProgram;
  data: AdminOverview;
}) {
  const t = useTranslations("adminPrograms");
  const unassigned = useTranslations("adminCommon")("unassigned");
  const locale = useLocale();
  const issues = issueCount(program, data);
  const health = programHealth(program, data);
  const coordinator = data.users.find(
    (user) => user.id === program.coordinatorId,
  );
  const missingAccess =
    coordinator != null && coordinator.status !== "APPROVED";
  const [assigning, setAssigning] = useState(false);
  return (
    <div
      className={`${cols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[14px] leading-[1.3] font-medium text-[#22262b]">
          {program.name}
        </span>
        <StatusPill status={program.status} />
      </span>
      <span>
        <IssuePill count={issues} />
      </span>
      <span className="flex min-w-0 items-center gap-2">
        {program.coordinatorName ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-white bg-[#fbe2d0] text-[10px] font-semibold text-[#a8480e]">
            {initials(program.coordinatorName)}
          </span>
        ) : null}
        <span
          className={`truncate text-[13px] leading-[1.3] ${missingAccess || !program.coordinatorName ? "text-[#b7791f]" : "text-[#22262b]"}`}
        >
          {programCoordinatorLabel(program, unassigned)}
        </span>
        {missingAccess ? (
          <span className="shrink-0 rounded-full bg-[#fff6e5] px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium text-[#b7791f]">
            {t("noAccess")}
          </span>
        ) : null}
      </span>
      <span className="truncate text-[12.5px] leading-[1.3] text-[#676e78]">
        {phaseLabel(program, data, t, locale)}
      </span>
      <span className="text-[13px] leading-[1.3] font-medium text-[#22262b]">
        {program.startupCount === 0 ? "—" : program.startupCount}
      </span>
      <span
        className={`text-[13px] leading-[1.3] font-medium ${
          program.startupCount > 0 && program.acceptedMentorCount === 0
            ? "text-[#b7791f]"
            : "text-[#22262b]"
        }`}
      >
        {program.startupCount === 0 ? "—" : program.acceptedMentorCount}
      </span>
      <span>
        <HealthBar green={health.green} amber={health.amber} red={health.red} />
      </span>
      <span className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setAssigning(true)}
          className="inline-flex items-center rounded-full border border-[#e9ecef] bg-white px-3.5 py-2 text-[12.5px] leading-[1.3] font-medium whitespace-nowrap text-[#22262b]"
        >
          {program.coordinatorName
            ? t("addCoordinator")
            : t("assignCoordinator")}
        </button>
        {assigning ? (
          <AssignCoordinatorDialog
            programId={program.id}
            programName={program.name}
            onClose={() => setAssigning(false)}
          />
        ) : null}
        <Link
          href={`/programs/${program.id}`}
          className="inline-flex items-center rounded-full border border-[#e9ecef] bg-white px-3.5 py-2 text-[12.5px] leading-[1.3] font-medium text-[#22262b]"
        >
          {t("open")}
        </Link>
        <Asset src="/admin/overflow.svg" className="h-8 w-[38px]" />
      </span>
    </div>
  );
}

function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-[#e9ecef] bg-white py-2.5 pr-3.5 pl-4">
      <span className="text-[13px] leading-[1.3] text-[#858c96]">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none bg-transparent text-[13.5px] leading-[1.3] font-medium text-[#22262b] outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Asset src="/admin/chevron-down-sm.svg" className="size-4" />
    </label>
  );
}

function StatusPill({ status }: { status: AdminProgram["status"] }) {
  const t = useTranslations("adminCommon");
  const active = status === ProgramStatus.Active;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium ${
        active ? "bg-[#eaf7f0] text-[#2f9e6b]" : "bg-[#f5f6f8] text-[#676e78]"
      }`}
    >
      <AdminIcon
        src={active ? "/admin/dot-success.svg" : "/admin/dot-muted.svg"}
        width={6}
        height={6}
      />
      {t(`programStatus.${status as ProgramStatus}`)}
    </span>
  );
}

function IssuePill({ count }: { count: number }) {
  const t = useTranslations("adminPrograms");
  if (count === 0) {
    return <span className="text-[13px] text-[#aeb4bc]">—</span>;
  }
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
      {t("issueCount", { count })}
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
  const t = useTranslations("adminPrograms");
  const total = green + amber + red;
  if (total === 0) {
    return (
      <span className="text-[12.5px] text-[#aeb4bc]">{t("notStarted")}</span>
    );
  }
  const usable = 150 - (parts.length - 1) * 3;
  return (
    <span className="flex h-2 w-[150px] gap-[3px]" aria-hidden>
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

const cols =
  "grid w-full grid-cols-[minmax(0,270fr)_110fr_minmax(0,240fr)_190fr_80fr_80fr_minmax(0,210fr)_108fr] items-center";

function issueCount(program: AdminProgram, data: AdminOverview) {
  const health = programHealth(program, data);
  return health.red + health.amber;
}

function programHealth(program: AdminProgram, data: AdminOverview) {
  let green = 0;
  let amber = 0;
  let red = 0;
  for (const startup of program.startups) {
    const mentorship = activeMentorshipFor(data, startup.id);
    const blocked = data.bottlenecks.some(
      (item) => item.organizationId === startup.id,
    );
    if (mentorship && needsAttention(mentorship)) red += 1;
    else if (blocked || !mentorship) amber += 1;
    else green += 1;
  }
  return { green, amber, red };
}

function phaseLabel(
  program: AdminProgram,
  data: AdminOverview,
  t: ReturnType<typeof useTranslations<"adminPrograms">>,
  locale: string,
) {
  const created = new Date(program.createdAt);
  const month = created
    .toLocaleDateString(locale, { month: "short" })
    .replace(".", "");
  const date = `${month} ${created.getFullYear()}`;
  if (program.status === ProgramStatus.Completed) {
    return t("phaseCompleted", { date });
  }
  const mentoring = program.startups.some((startup) =>
    activeMentorshipFor(data, startup.id),
  );
  return mentoring ? t("phaseMentoring", { date }) : t("phaseSetup", { date });
}
