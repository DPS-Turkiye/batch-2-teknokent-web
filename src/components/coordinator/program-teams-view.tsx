"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  EmptyNote,
  FilterPills,
  QueryNotice,
  StatusChip,
} from "@/components/admin/admin-ui";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import { ProgramWithoutTeam } from "@/components/coordinator/program-without-team";
import { TeamDetailDrawer } from "@/components/coordinator/team-detail-drawer";
import { useProgramTeams } from "@/hooks/use-program-teams";
import {
  ProgramLifecycle,
  TeamJoinStatus,
  type ProgramTeam,
} from "@/interfaces/coordinator-program";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import {
  codeSentLabel,
  daysWaiting,
  isTeamProblem,
  type TeamRowDraft,
} from "@/lib/program-launch";
import { initials } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

export function ProgramTeamsView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Teams}>
      {(detail) => (
        <div className="space-y-8">
          <TeamsBody
            programId={programId}
            archived={detail.program.lifecycle === ProgramLifecycle.Completed}
          />
          <ProgramWithoutTeam programId={programId} />
        </div>
      )}
    </ProgramDetailFrame>
  );
}

type Teams = ReturnType<typeof useProgramTeams>;

function TeamsBody({
  programId,
  archived,
}: {
  programId: string;
  archived: boolean;
}) {
  const t = useTranslations("programTeams");
  const teams = useProgramTeams(programId);
  const joined = teams.teams.filter(
    (team) => team.status === TeamJoinStatus.Joined,
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-[#22262b]">
            {t("title")}
          </h2>
          <p className="text-[13.5px] text-[#676e78]">
            <span className="font-semibold text-[#22262b]">
              {joined} / {teams.teams.length}
            </span>{" "}
            {t("joinedSummary", { count: teams.teams.length - joined })}
          </p>
        </div>
        {archived ? null : (
          <button
            type="button"
            onClick={teams.startAdding}
            className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#22262b] px-4 py-2.5 text-[13px] font-medium text-white"
          >
            <Plus aria-hidden className="size-4" /> {t("add")}
          </button>
        )}
      </div>

      <FilterPills
        value={teams.filter}
        onChange={teams.setFilter}
        options={teams.filterOptions}
      />

      {teams.adding ? (
        <TeamForm
          title={t("newTeam")}
          row={teams.adding}
          onChange={teams.changeAdding}
          onSave={teams.saveAdding}
          onCancel={teams.cancel}
          busy={teams.busy}
          error={teams.error}
          saveLabel={t("addAndCode")}
        />
      ) : null}

      <QueryNotice
        isLoading={teams.query.isLoading}
        error={teams.query.error}
      />
      {teams.query.isSuccess && teams.visible.length === 0 ? (
        <EmptyNote>
          {teams.teams.length === 0 ? t("empty") : t("noMatch")}
        </EmptyNote>
      ) : null}

      {teams.visible.length > 0 ? (
        <div className="overflow-x-auto rounded-[28px] border border-[#e9ecef] bg-white">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <thead className="text-[12.5px] text-[#858c96]">
              <tr className="border-b border-[#f0f2f4]">
                <th className="px-6 py-4 font-normal">{t("columns.team")}</th>
                <th className="px-4 py-4 font-normal">{t("columns.status")}</th>
                <th className="px-4 py-4 font-normal">{t("columns.lead")}</th>
                <th className="px-4 py-4 font-normal">{t("columns.code")}</th>
                <th className="px-4 py-4 font-normal">
                  {t("columns.members")}
                </th>
                <th className="px-6 py-4">
                  <span className="sr-only">{t("columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.visible.map((team) =>
                teams.editing?.key === team.inviteId ? (
                  <tr key={team.inviteId}>
                    <td colSpan={6} className="p-3">
                      <TeamForm
                        title={t("editing", { name: team.name })}
                        row={teams.editing}
                        onChange={teams.changeEditing}
                        onSave={teams.saveEditing}
                        onCancel={teams.cancel}
                        busy={teams.busy}
                        error={teams.error}
                        saveLabel={t("save")}
                      />
                    </td>
                  </tr>
                ) : (
                  <TeamRow
                    key={team.inviteId ?? team.organizationId ?? team.name}
                    team={team}
                    teams={teams}
                    archived={archived}
                  />
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {teams.detailId ? (
        <TeamDetailDrawer
          programId={programId}
          organizationId={teams.detailId}
          onCopyCode={(code) => void teams.copyCode(code)}
          onClose={teams.closeDetail}
        />
      ) : null}
    </div>
  );
}

function TeamRow({
  team,
  teams,
  archived,
}: {
  team: ProgramTeam;
  teams: Teams;
  archived: boolean;
}) {
  const t = useTranslations("programTeams");
  const locale = useLocale();
  const waiting = team.status === TeamJoinStatus.Waiting;
  const problem = isTeamProblem(team);
  const sent = codeSentLabel(team, t, locale);
  const days = daysWaiting(team.invitedAt);
  return (
    <tr className="border-b border-[#f0f2f4] last:border-0">
      <td className="px-6 py-4">
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#fff1ea] text-[11px] font-semibold text-[#ff6a3d]"
          >
            {initials(team.name)}
          </span>
          <span className="text-[#22262b]">{team.name}</span>
        </span>
      </td>
      <td className="px-4 py-4">
        {problem ? (
          <StatusChip tone="red">{t("emailFailed")}</StatusChip>
        ) : waiting ? (
          <StatusChip tone="amber">
            {days > 0 ? t("waitingLeadDays", { days }) : t("waitingLead")}
          </StatusChip>
        ) : (
          <StatusChip tone="green">{t("leadJoined")}</StatusChip>
        )}
      </td>
      <td
        className={`px-4 py-4 ${problem ? "text-[#d9464b]" : "text-[#22262b]"}`}
      >
        {waiting ? team.leadEmail : (team.leadName ?? team.leadEmail ?? "—")}
        {waiting && sent ? (
          <span className="block text-[12px] text-[#858c96]">{sent}</span>
        ) : null}
      </td>
      <td className="px-4 py-4">
        {team.code ? (
          <span className="inline-flex items-center gap-2 font-semibold text-[#22262b]">
            {team.code}
            <button
              type="button"
              aria-label={t("copyCode", { name: team.name })}
              onClick={() => void teams.copyCode(team.code!)}
              className="grid size-7 place-items-center rounded-full text-[#858c96] hover:bg-[#f4f5f7]"
            >
              <Copy aria-hidden className="size-3.5" />
            </button>
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-4 py-4 text-[#676e78]">
        {waiting ? "—" : t("memberCount", { count: team.memberCount })}
      </td>
      <td className="px-6 py-4">
        {waiting && team.inviteId && !archived ? (
          <span className="flex items-center justify-end gap-1">
            {problem ? (
              <button
                type="button"
                onClick={() => teams.startEditing(team)}
                className="rounded-full bg-[#22262b] px-3.5 py-2 text-[12.5px] font-medium text-white"
              >
                {t("fixEmail")}
              </button>
            ) : (
              <button
                type="button"
                disabled={teams.busy}
                onClick={() => teams.sendCode(team)}
                className="rounded-full bg-[#22262b] px-3.5 py-2 text-[12.5px] font-medium text-white disabled:opacity-50"
              >
                {teams.sendingCodeFor === team.inviteId
                  ? t("sending")
                  : team.codeSentAt
                    ? t("resendCode")
                    : t("sendCode")}
              </button>
            )}
            <button
              type="button"
              aria-label={t("edit", { name: team.name })}
              onClick={() => teams.startEditing(team)}
              className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-[#f4f5f7]"
            >
              <Pencil aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              aria-label={t("remove", { name: team.name })}
              disabled={teams.busy}
              onClick={() => teams.remove(team.inviteId!)}
              className="grid size-8 place-items-center rounded-full text-[#d9464b] hover:bg-[#fff1f0] disabled:opacity-40"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </span>
        ) : !waiting && team.organizationId ? (
          <span className="flex justify-end">
            <button
              type="button"
              onClick={() => teams.openDetail(team.organizationId!)}
              className="rounded-full border border-[#e9ecef] px-3.5 py-2 text-[12.5px] font-medium text-[#22262b]"
            >
              {t("detail")}
            </button>
          </span>
        ) : null}
      </td>
    </tr>
  );
}

function TeamForm({
  title,
  row,
  onChange,
  onSave,
  onCancel,
  busy,
  error,
  saveLabel,
}: {
  title: string;
  row: TeamRowDraft;
  onChange: (patch: Partial<TeamRowDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  error: string | null;
  saveLabel: string;
}) {
  const t = useTranslations("programTeams");
  return (
    <form
      aria-label={title}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      className="space-y-3 rounded-[22px] border border-[#e9ecef] bg-[#f7f8f9] p-4"
    >
      <p className="text-[13.5px] font-medium text-[#22262b]">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          aria-label={t("teamName")}
          value={row.teamName}
          maxLength={255}
          onChange={(event) => onChange({ teamName: event.target.value })}
          placeholder={t("teamName")}
          className={FIELD}
        />
        <input
          aria-label={t("leadEmail")}
          type="email"
          value={row.leadEmail}
          maxLength={255}
          onChange={(event) => onChange({ leadEmail: event.target.value })}
          placeholder={t("leadEmailPlaceholder")}
          className={FIELD}
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {error ? (
          <p role="alert" className="mr-auto text-[13px] text-[#d9464b]">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-[13px] text-[#22262b]"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
        >
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
