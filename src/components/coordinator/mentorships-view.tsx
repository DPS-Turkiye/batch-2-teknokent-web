"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  Avatar,
  EmptyNote,
  FilterPills,
  QueryNotice,
  ScrollTable,
  SearchField,
  StatusChip,
} from "@/components/admin/admin-ui";
import { MentorshipDrawer } from "@/components/coordinator/mentorship-drawer";
import { PillSelect } from "@/components/coordinator/pill-select";
import { ProgramTypeChip } from "@/components/coordinator/program-type-chip";
import { useCoordinatorMentorshipList } from "@/hooks/use-coordinator-mentorships";
import { useOptionLabel } from "@/hooks/use-option-label";
import type { ProgramType } from "@/interfaces/program";
import {
  type CoordinatorMentorship,
  CoordinatorMentorshipHealth,
} from "@/interfaces/coordinator-mentorship";
import {
  actionsLabel,
  ALL_TOPICS,
  HEALTH_TONES,
  lastMeetingLabel,
  MentorshipSort,
  needsIntervention,
  nextMeetingLabel,
} from "@/lib/coordinator-mentorships";
import {
  PROGRAM_TYPE_FILTERS,
  type ProgramTypeFilter,
} from "@/lib/program-types";
import { initials } from "@/lib/utils";

const GRID =
  "grid grid-cols-[minmax(240px,2.4fr)_120px_minmax(140px,1.3fr)_110px_minmax(130px,1.1fr)_minmax(150px,1.3fr)_120px] items-center gap-4";

export function CoordinatorMentorshipsView({
  initialSelectedId,
}: {
  initialSelectedId: string | null;
}) {
  const t = useTranslations("coordinatorMentorships");
  const tType = useTranslations("programTypes");
  const optionLabel = useOptionLabel();
  const list = useCoordinatorMentorshipList(initialSelectedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          value={list.health}
          onChange={list.setHealth}
          options={list.healthOptions}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            value={list.search}
            onChange={list.setSearch}
            placeholder={t("search")}
          />
          <PillSelect
            label={t("topic")}
            value={list.topic}
            onChange={list.setTopic}
            options={list.topicOptions.map((topic) => ({
              value: topic,
              label:
                topic === ALL_TOPICS
                  ? t("allTopics")
                  : optionLabel("mentorTopic", topic),
            }))}
          />
          <PillSelect
            label={t("sortBy")}
            value={list.sort}
            onChange={(value) => list.setSort(value as MentorshipSort)}
            options={Object.values(MentorshipSort).map((sort) => ({
              value: sort,
              label: t(`sort.${sort}`),
            }))}
          />
          {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
          <PillSelect
            label={tType("label")}
            value={list.type}
            onChange={(value) => list.setType(value as ProgramTypeFilter)}
            options={PROGRAM_TYPE_FILTERS.map((value) => ({
              value,
              label: tType(value),
            }))}
          />
          <PillSelect
            label={t("program")}
            value={list.programId ?? ""}
            onChange={(value) => list.setProgramId(value || null)}
            options={[
              { value: "", label: t("allPrograms") },
              ...list.programOptions.map((program) => ({
                value: program.id,
                label: program.name,
              })),
            ]}
          />
        </div>
      </div>

      <QueryNotice isLoading={list.query.isLoading} error={list.query.error} />
      {list.query.data ? (
        <ScrollTable>
          <div
            className={`${GRID} border-b border-[#eef0f2] px-7 py-4 text-[12.5px] text-[#676e78]`}
          >
            <span>{t("columns.mentorship")}</span>
            <span>{t("columns.health")}</span>
            <span>{t("columns.topic")}</span>
            <span>{t("columns.lastMeeting")}</span>
            <span>{t("columns.nextMeeting")}</span>
            <span>{t("columns.openActions")}</span>
            <span className="sr-only">{t("columns.action")}</span>
          </div>
          {list.visible.length === 0 ? (
            <EmptyNote>{t("empty")}</EmptyNote>
          ) : (
            <ul>
              {list.visible.map((row) => (
                <MentorshipRow
                  key={row.id}
                  row={row}
                  type={list.typeOf(row.programId)}
                  onOpen={() => list.open(row.id)}
                />
              ))}
            </ul>
          )}
          {list.hasMore ? (
            <div className="flex justify-end px-7 py-4">
              <button
                type="button"
                onClick={list.showMore}
                className="inline-flex items-center gap-1 text-[13px] text-[#676e78]"
              >
                {t("loadMore")} <ArrowRight aria-hidden className="size-3.5" />
              </button>
            </div>
          ) : null}
        </ScrollTable>
      ) : null}

      {list.selectedId ? (
        <MentorshipDrawer
          key={list.selectedId}
          id={list.selectedId}
          onClose={list.close}
        />
      ) : null}
    </div>
  );
}

function MentorshipRow({
  row,
  type,
  onOpen,
}: {
  row: CoordinatorMentorship;
  type: ProgramType | null;
  onOpen: () => void;
}) {
  const t = useTranslations("coordinatorMentorships");
  const locale = useLocale();
  const optionLabel = useOptionLabel();
  const texts = { t, locale };
  const pair = `${row.mentorName} ↔ ${row.organizationName}`;
  const lateTone =
    row.health === CoordinatorMentorshipHealth.Risky
      ? "text-[#d9464b]"
      : row.health === CoordinatorMentorshipHealth.FollowUp
        ? "text-[#b7791f]"
        : "text-[#22262b]";
  const actionsTone =
    row.overdueActions > 0
      ? "text-[#d9464b]"
      : row.openActions === 0 && row.missingNotes > 0
        ? "text-[#b7791f]"
        : "text-[#22262b]";
  const intervene = needsIntervention(row);
  return (
    <li
      className={`${GRID} border-b border-[#f0f2f4] px-7 py-3.5 last:border-0 ${
        intervene ? "bg-[#fbfbfc]" : ""
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex -space-x-1.5">
          <Avatar initials={initials(row.mentorName)} tone="blue" />
          <Avatar initials={initials(row.organizationName)} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] text-[#22262b]">
            {pair}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[#858c96]">
            <span className="truncate">{row.programName}</span>
            {type ? <ProgramTypeChip type={type} /> : null}
          </span>
        </span>
      </span>
      <span>
        <StatusChip tone={HEALTH_TONES[row.health]}>
          {t(`health.${row.health}`)}
        </StatusChip>
      </span>
      <span className="min-w-0">
        {row.topic ? (
          <StatusChip tone="orange">
            {optionLabel("mentorTopic", row.topic)}
          </StatusChip>
        ) : (
          <span className="text-[#aeb4bc]">—</span>
        )}
      </span>
      <span className={`text-[13px] ${lateTone}`}>
        {lastMeetingLabel(row, texts)}
      </span>
      <span
        className={`text-[13px] ${row.nextMeetingAt ? "text-[#22262b]" : "text-[#aeb4bc]"}`}
      >
        {nextMeetingLabel(row, texts)}
      </span>
      <span className={`text-[13px] ${actionsTone}`}>
        {actionsLabel(row, t)}
      </span>
      <span className="flex justify-end">
        <button
          type="button"
          onClick={onOpen}
          aria-label={
            intervene
              ? t("interveneLabel", { pair })
              : t("reviewLabel", { pair })
          }
          className={
            intervene
              ? "inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white"
              : "inline-flex h-9 items-center rounded-full border border-[#e9ecef] bg-white px-4 text-[12.5px] font-medium text-[#22262b]"
          }
        >
          {intervene ? t("intervene") : t("review")}
        </button>
      </span>
    </li>
  );
}
