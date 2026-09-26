"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";

import {
  EmptyNote,
  FilterPills,
  QueryNotice,
  StatusChip,
} from "@/components/admin/admin-ui";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import { useProgramTeams } from "@/hooks/use-program-teams";
import {
  ProgramLifecycle,
  type ProgramTeam,
  TeamJoinStatus,
} from "@/interfaces/coordinator-program";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import { daysWaiting, type TeamRowDraft } from "@/lib/program-launch";
import { initials } from "@/lib/utils";

const FIELD =
  "h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13.5px] text-[#22262b] outline-none focus:border-[#22262b]";

export function ProgramTeamsView({ programId }: { programId: string }) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Teams}>
      {(detail) => (
        <TeamsBody
          programId={programId}
          archived={detail.program.lifecycle === ProgramLifecycle.Completed}
        />
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
  const teams = useProgramTeams(programId);
  const joined = teams.teams.filter(
    (team) => team.status === TeamJoinStatus.Joined,
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-[#22262b]">
            Takım katılımı
          </h2>
          <p className="text-[13.5px] text-[#676e78]">
            <span className="font-semibold text-[#22262b]">
              {joined} / {teams.teams.length}
            </span>{" "}
            yetkili katıldı · {teams.teams.length - joined} takım bekleniyor
          </p>
        </div>
        {archived ? null : (
          <button
            type="button"
            onClick={teams.startAdding}
            className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#22262b] px-4 py-2.5 text-[13px] font-medium text-white"
          >
            <Plus aria-hidden className="size-4" /> Takım ekle
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
          title="Yeni takım"
          row={teams.adding}
          onChange={teams.changeAdding}
          onSave={teams.saveAdding}
          onCancel={teams.cancel}
          busy={teams.busy}
          error={teams.error}
          saveLabel="Ekle ve kod üret"
        />
      ) : null}

      <QueryNotice
        isLoading={teams.query.isLoading}
        error={teams.query.error}
      />
      {teams.query.isSuccess && teams.visible.length === 0 ? (
        <EmptyNote>
          {teams.teams.length === 0
            ? "Henüz takım eklenmedi. “Takım ekle” ile yetkilisinin e-postasını girin; katılım kodu hemen üretilir."
            : "Bu filtreyle eşleşen takım yok."}
        </EmptyNote>
      ) : null}

      {teams.visible.length > 0 ? (
        <div className="overflow-x-auto rounded-[28px] border border-[#e9ecef] bg-white">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <thead className="text-[12.5px] text-[#858c96]">
              <tr className="border-b border-[#f0f2f4]">
                <th className="px-6 py-4 font-normal">Takım</th>
                <th className="px-4 py-4 font-normal">Katılım durumu</th>
                <th className="px-4 py-4 font-normal">Takım yetkilisi</th>
                <th className="px-4 py-4 font-normal">Takım kodu</th>
                <th className="px-4 py-4 font-normal">Üyeler</th>
                <th className="px-6 py-4">
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {teams.visible.map((team) =>
                teams.editing && teams.editing.key === team.inviteId ? (
                  <tr key={team.inviteId}>
                    <td colSpan={6} className="p-3">
                      <TeamForm
                        title={`${team.name} düzenleniyor`}
                        row={teams.editing}
                        onChange={teams.changeEditing}
                        onSave={teams.saveEditing}
                        onCancel={teams.cancel}
                        busy={teams.busy}
                        error={teams.error}
                        saveLabel="Kaydet"
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
  const waiting = team.status === TeamJoinStatus.Waiting;
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
        {waiting ? (
          <StatusChip tone="amber">
            Yetkili bekleniyor{days > 0 ? ` · ${days} gün` : ""}
          </StatusChip>
        ) : (
          <StatusChip tone="green">Yetkili katıldı</StatusChip>
        )}
      </td>
      <td className="px-4 py-4 text-[#22262b]">
        {waiting ? team.leadEmail : (team.leadName ?? team.leadEmail ?? "—")}
      </td>
      <td className="px-4 py-4">
        {team.code ? (
          <span className="inline-flex items-center gap-2 font-semibold text-[#22262b]">
            {team.code}
            <button
              type="button"
              aria-label={`${team.name} kodunu kopyala`}
              onClick={() => void teams.copyCode(team.code as string)}
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
        {waiting ? "—" : `${team.memberCount} üye`}
      </td>
      <td className="px-6 py-4">
        {waiting && team.inviteId && !archived ? (
          <span className="flex justify-end gap-1">
            <button
              type="button"
              aria-label={`${team.name} düzenle`}
              onClick={() => teams.startEditing(team)}
              className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-[#f4f5f7]"
            >
              <Pencil aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              aria-label={`${team.name} kaldır`}
              disabled={teams.busy}
              onClick={() => teams.remove(team.inviteId as string)}
              className="grid size-8 place-items-center rounded-full text-[#d9464b] hover:bg-[#fff1f0] disabled:opacity-40"
            >
              <Trash2 aria-hidden className="size-4" />
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
          aria-label="Takım adı"
          value={row.teamName}
          maxLength={255}
          onChange={(event) => onChange({ teamName: event.target.value })}
          placeholder="Takım adı"
          className={FIELD}
        />
        <input
          aria-label="Takım yetkilisi e-postası"
          type="email"
          value={row.leadEmail}
          maxLength={255}
          onChange={(event) => onChange({ leadEmail: event.target.value })}
          placeholder="yetkili@ornek.com"
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
          Vazgeç
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
