// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId } from "react";

import {
  EmptyNote,
  OutlineButton,
  Panel,
  QueryNotice,
  SolidButton,
  StatusChip,
} from "@/components/admin/admin-ui";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import {
  useProgramAssignments,
  type ProgramAssignments,
} from "@/hooks/use-program-assignments";
import {
  ProgramLifecycle,
  type ProgramPhase,
} from "@/interfaces/coordinator-program";
import type { ProgramAssignment } from "@/interfaces/program-assignment";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import { SUBMISSION_STATE_TONES } from "@/lib/program-assignments";
import { calendarDay, formatDateTime, formatDayMonth } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

export function ProgramAssignmentsView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Assignments}>
      {(detail) => (
        <AssignmentsBody
          programId={programId}
          phases={detail.program.phases}
          archived={detail.program.lifecycle === ProgramLifecycle.Completed}
        />
      )}
    </ProgramDetailFrame>
  );
}

function AssignmentsBody({
  programId,
  phases,
  archived,
}: {
  programId: string;
  phases: ProgramPhase[];
  archived: boolean;
}) {
  const t = useTranslations("programAssignments");
  const assignments = useProgramAssignments(programId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-[#22262b]">
            {t("title")}
          </h2>
          <p className="text-[13.5px] text-[#676e78]">{t("hint")}</p>
        </div>
        {archived || assignments.formOpen ? null : (
          <button
            type="button"
            onClick={assignments.openForm}
            className="inline-flex items-center gap-2 self-start rounded-full bg-[#22262b] px-4 py-2.5 text-[13.5px] font-medium text-white"
          >
            <Plus aria-hidden className="size-4" />
            {t("give")}
          </button>
        )}
      </div>

      {assignments.formOpen ? (
        <AssignmentForm assignments={assignments} phases={phases} />
      ) : null}

      {assignments.isLoading || assignments.error ? (
        <QueryNotice
          isLoading={assignments.isLoading}
          error={assignments.error}
        />
      ) : assignments.assignments.length === 0 ? (
        <EmptyNote>{t("empty")}</EmptyNote>
      ) : (
        <ul className="space-y-3">
          {assignments.assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              phaseName={assignments.phaseName(phases, assignment.phaseId)}
              expanded={assignments.expandedId === assignment.id}
              onToggle={() => assignments.toggle(assignment.id)}
              onOpenSubmission={assignments.openSubmission}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AssignmentForm({
  assignments,
  phases,
}: {
  assignments: ProgramAssignments;
  phases: ProgramPhase[];
}) {
  const t = useTranslations("programAssignments");
  const id = useId();
  const { draft, setField } = assignments;
  return (
    <Panel>
      <form
        className="space-y-4 p-5"
        aria-label={t("formLabel")}
        onSubmit={(event) => {
          event.preventDefault();
          assignments.submit();
        }}
      >
        <p className="text-[13px] text-[#676e78]">{t("allTeams")}</p>
        <label className="block space-y-1.5" htmlFor={`${id}-title`}>
          <span className="text-[13px] font-medium text-[#22262b]">
            {t("fields.title")}
          </span>
          <input
            id={`${id}-title`}
            className={FIELD}
            value={draft.title}
            onChange={(event) => setField("title", event.target.value)}
          />
        </label>
        <label className="block space-y-1.5" htmlFor={`${id}-description`}>
          <span className="text-[13px] font-medium text-[#22262b]">
            {t("fields.description")}
          </span>
          <textarea
            id={`${id}-description`}
            rows={4}
            className="w-full rounded-xl border border-[#e9ecef] px-3 py-2 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]"
            value={draft.description}
            onChange={(event) => setField("description", event.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5" htmlFor={`${id}-due`}>
            <span className="text-[13px] font-medium text-[#22262b]">
              {t("fields.dueDate")}
            </span>
            <input
              id={`${id}-due`}
              type="date"
              min={assignments.today}
              className={FIELD}
              value={draft.dueDate}
              onChange={(event) => setField("dueDate", event.target.value)}
            />
          </label>
          {phases.length > 0 ? (
            <label className="block space-y-1.5" htmlFor={`${id}-phase`}>
              <span className="text-[13px] font-medium text-[#22262b]">
                {t("fields.phase")}
              </span>
              <select
                id={`${id}-phase`}
                className={FIELD}
                value={draft.phaseId}
                onChange={(event) => setField("phaseId", event.target.value)}
              >
                <option value="">{t("fields.noPhase")}</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-[13.5px] text-[#22262b]">
          <input
            type="checkbox"
            checked={draft.fileRequired}
            onChange={(event) => setField("fileRequired", event.target.checked)}
          />
          {t("fields.fileRequired")}
        </label>
        {assignments.problem ? (
          <p role="alert" className="text-[13px] text-[#d9464b]">
            {t(`problems.${assignments.problem}`)}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <OutlineButton onClick={assignments.closeForm}>
            {t("cancel")}
          </OutlineButton>
          <SolidButton type="submit" disabled={!assignments.canSubmit}>
            {assignments.submitting ? t("sending") : t("send")}
          </SolidButton>
        </div>
      </form>
    </Panel>
  );
}

function AssignmentCard({
  assignment,
  phaseName,
  expanded,
  onToggle,
  onOpenSubmission,
}: {
  assignment: ProgramAssignment;
  phaseName: string | null;
  expanded: boolean;
  onToggle: () => void;
  onOpenSubmission: (documentId: string) => void;
}) {
  const t = useTranslations("programAssignments");
  const locale = useLocale();
  const panelId = useId();
  const meta = [
    assignment.dueDate
      ? t("due", {
          date: formatDayMonth(calendarDay(assignment.dueDate), locale),
        })
      : t("noDue"),
    phaseName,
    assignment.fileRequired ? t("fileRequired") : null,
    assignment.createdByName,
  ].filter(Boolean);
  return (
    <li className="rounded-2xl border border-[#e9ecef] bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="min-w-0 space-y-1">
          <span className="block text-[14.5px] font-medium text-[#22262b]">
            {assignment.title}
          </span>
          <span className="block text-[12.5px] text-[#858c96]">
            {meta.join(" · ")}
          </span>
          <span className="block text-[12.5px] text-[#676e78]">
            {t("summary", {
              submitted: assignment.submittedCount,
              late: assignment.lateCount,
              overdue: assignment.overdueCount,
              open: assignment.openCount,
            })}
          </span>
        </span>
        {expanded ? (
          <ChevronDown aria-hidden className="mt-1 size-4 shrink-0" />
        ) : (
          <ChevronRight aria-hidden className="mt-1 size-4 shrink-0" />
        )}
      </button>
      {expanded ? (
        <div
          id={panelId}
          className="space-y-3 border-t border-[#e9ecef] px-5 py-4"
        >
          {assignment.description ? (
            <p className="whitespace-pre-line text-[13px] text-[#676e78]">
              {assignment.description}
            </p>
          ) : null}
          {assignment.teams.length === 0 ? (
            <EmptyNote>{t("noTeams")}</EmptyNote>
          ) : (
            <ul className="divide-y divide-[#f1f3f5]">
              {assignment.teams.map((team) => (
                <li
                  key={team.assignmentId}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                >
                  <span className="text-[13.5px] text-[#22262b]">
                    {team.organizationName}
                  </span>
                  <span className="flex flex-wrap items-center gap-2.5">
                    {team.submittedAt ? (
                      <span className="text-[12px] text-[#858c96]">
                        {formatDateTime(team.submittedAt, locale)}
                      </span>
                    ) : null}
                    {team.documentId ? (
                      <SubmissionLink
                        documentId={team.documentId}
                        label={team.filename ?? t("openFile")}
                        ariaLabel={t("openFileLabel", {
                          team: team.organizationName,
                        })}
                        onOpen={onOpenSubmission}
                      />
                    ) : null}
                    <StatusChip tone={SUBMISSION_STATE_TONES[team.state]}>
                      {t(`state.${team.state}`)}
                    </StatusChip>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </li>
  );
}

function SubmissionLink({
  documentId,
  label,
  ariaLabel,
  onOpen,
}: {
  documentId: string;
  label: string;
  ariaLabel: string;
  onOpen: (documentId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(documentId)}
      aria-label={ariaLabel}
      className="text-[12.5px] font-medium text-[#1583d6] underline"
    >
      {label}
    </button>
  );
}
