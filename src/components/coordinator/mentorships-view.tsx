"use client";

import { ArrowRight } from "lucide-react";

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
import { useCoordinatorMentorshipList } from "@/hooks/use-coordinator-mentorships";
import {
  type CoordinatorMentorship,
  CoordinatorMentorshipHealth,
} from "@/interfaces/coordinator-mentorship";
import {
  actionsLabel,
  HEALTH_LABELS,
  HEALTH_TONES,
  lastMeetingLabel,
  MentorshipSort,
  needsIntervention,
  nextMeetingLabel,
  SORT_LABELS,
} from "@/lib/coordinator-mentorships";
import { initials } from "@/lib/utils";

const GRID =
  "grid grid-cols-[minmax(240px,2.4fr)_120px_minmax(140px,1.3fr)_110px_minmax(130px,1.1fr)_minmax(150px,1.3fr)_120px] items-center gap-4";

export function CoordinatorMentorshipsView({
  initialSelectedId,
}: {
  initialSelectedId: string | null;
}) {
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
            placeholder="Mentor veya takım ara"
          />
          <PillSelect
            label="Konu:"
            value={list.topic}
            onChange={list.setTopic}
            options={list.topicOptions.map((topic) => ({
              value: topic,
              label: topic,
            }))}
          />
          <PillSelect
            label="Sırala:"
            value={list.sort}
            onChange={(value) => list.setSort(value as MentorshipSort)}
            options={Object.values(MentorshipSort).map((sort) => ({
              value: sort,
              label: SORT_LABELS[sort],
            }))}
          />
          <PillSelect
            label="Program:"
            value={list.programId ?? ""}
            onChange={(value) => list.setProgramId(value || null)}
            options={[
              { value: "", label: "Tüm programlar" },
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
            <span>Mentorluk</span>
            <span>Sağlık</span>
            <span>Konu</span>
            <span>Son görüşme</span>
            <span>Sıradaki görüşme</span>
            <span>Açık aksiyonlar</span>
            <span className="sr-only">İşlem</span>
          </div>
          {list.visible.length === 0 ? (
            <EmptyNote>Bu filtrelere uyan mentorluk yok.</EmptyNote>
          ) : (
            <ul>
              {list.visible.map((row) => (
                <MentorshipRow
                  key={row.id}
                  row={row}
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
                Daha fazla yükle <ArrowRight aria-hidden className="size-3.5" />
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
  onOpen,
}: {
  row: CoordinatorMentorship;
  onOpen: () => void;
}) {
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
            {row.mentorName} ↔ {row.organizationName}
          </span>
          <span className="block truncate text-[12px] text-[#858c96]">
            {row.programName}
          </span>
        </span>
      </span>
      <span>
        <StatusChip tone={HEALTH_TONES[row.health]}>
          {HEALTH_LABELS[row.health]}
        </StatusChip>
      </span>
      <span className="min-w-0">
        {row.topic ? (
          <StatusChip tone="orange">{row.topic}</StatusChip>
        ) : (
          <span className="text-[#aeb4bc]">—</span>
        )}
      </span>
      <span className={`text-[13px] ${lateTone}`}>{lastMeetingLabel(row)}</span>
      <span
        className={`text-[13px] ${row.nextMeetingAt ? "text-[#22262b]" : "text-[#aeb4bc]"}`}
      >
        {nextMeetingLabel(row)}
      </span>
      <span className={`text-[13px] ${actionsTone}`}>{actionsLabel(row)}</span>
      <span className="flex justify-end">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${row.mentorName} ↔ ${row.organizationName} ${intervene ? "müdahale et" : "incele"}`}
          className={
            intervene
              ? "inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white"
              : "inline-flex h-9 items-center rounded-full border border-[#e9ecef] bg-white px-4 text-[12.5px] font-medium text-[#22262b]"
          }
        >
          {intervene ? "Müdahale" : "İncele"}
        </button>
      </span>
    </li>
  );
}
