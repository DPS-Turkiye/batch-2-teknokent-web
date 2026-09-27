"use client";

import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Avatar,
  EmptyNote,
  FilterPills,
  QueryNotice,
  SearchField,
  StatusChip,
} from "@/components/admin/admin-ui";
import { FirstStepsDrawer } from "@/components/coordinator/first-steps-drawer";
import { ProgramDetailFrame } from "@/components/coordinator/program-detail-frame";
import { MAX_COORDINATOR_NOTE } from "@/hooks/use-coordinator-notes";
import { useProgramMatching } from "@/hooks/use-program-matching";
import type {
  MatchCandidate,
  ProgramMatch,
  WaitingTeam,
} from "@/interfaces/program-matching";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import {
  INTRO_MEETING_MINUTES,
  isFull,
  loadAfterMatch,
  loadShare,
  MatchTab,
  matchTabOptions,
  NEED_SOURCE_NOTES,
  needLabel,
  teamMeta,
  waitingLabel,
} from "@/lib/program-matching";
import { formatLongDate, initials } from "@/lib/utils";

type Matching = ReturnType<typeof useProgramMatching>;

export function ProgramMatchingView({
  programId,
  initialTeamId,
}: {
  programId: string;
  initialTeamId?: string;
}) {
  return (
    <ProgramDetailFrame programId={programId} tab={ProgramTab.Matching}>
      {() => (
        <MatchingBody programId={programId} initialTeamId={initialTeamId} />
      )}
    </ProgramDetailFrame>
  );
}

function MatchingBody({
  programId,
  initialTeamId,
}: {
  programId: string;
  initialTeamId?: string;
}) {
  const matching = useProgramMatching(programId, initialTeamId);
  const overview = matching.overview.data;

  return (
    <div className="space-y-5">
      <FilterPills
        value={matching.tab}
        onChange={matching.setTab}
        options={matchTabOptions(overview)}
      />
      <QueryNotice
        isLoading={matching.overview.isLoading}
        error={matching.overview.error}
      />
      {matching.matched ? (
        <p
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#eefaf3] px-4 py-3 text-[13.5px] text-[#0f7a4d]"
        >
          <Check aria-hidden className="size-4" />
          <b>
            {matching.matched.team} ↔ {matching.matched.mentor} eşleşti
          </b>
          · bildirimler gönderildi
          {matching.hasFirstSteps ? (
            <button
              type="button"
              onClick={matching.openFirstSteps}
              className="ml-auto font-medium underline"
            >
              İlk adımlar
            </button>
          ) : (
            <Link
              href="/coordinator/mentorships"
              className="ml-auto font-medium underline"
            >
              Mentorluğu aç
            </Link>
          )}
        </p>
      ) : null}
      {overview && matching.tab === MatchTab.Waiting ? (
        matching.waiting.length === 0 ? (
          <EmptyNote>Eşleşme bekleyen takım yok.</EmptyNote>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <WaitingList matching={matching} />
            {matching.team ? (
              <TeamPanel matching={matching} team={matching.team} />
            ) : null}
          </div>
        )
      ) : null}
      {overview && matching.tab === MatchTab.Active ? (
        <MatchList matches={overview.active} empty="Henüz aktif eşleşme yok." />
      ) : null}
      {overview && matching.tab === MatchTab.Past ? (
        <MatchList matches={overview.past} empty="Geçmiş eşleşme yok." />
      ) : null}
      {matching.firstSteps ? (
        <FirstStepsDrawer
          programId={programId}
          steps={matching.firstSteps}
          onClose={matching.closeFirstSteps}
        />
      ) : null}
      {matching.confirming && matching.team ? (
        <ConfirmDialog
          matching={matching}
          team={matching.team}
          candidate={matching.confirming}
        />
      ) : null}
    </div>
  );
}

function WaitingList({ matching }: { matching: Matching }) {
  const oldest = matching.waiting[0];
  return (
    <section
      aria-label="Eşleşme bekleyen takımlar"
      className="self-start rounded-[28px] border border-[#e9ecef] bg-white p-4"
    >
      <div className="px-2 pb-3">
        <h2 className="text-[15px] font-semibold text-[#22262b]">
          Eşleşme bekleyen takımlar
        </h2>
        <p className="text-[12.5px] text-[#858c96]">
          {matching.waiting.length} takım · en eskisi{" "}
          {waitingLabel(oldest.waitingDays)}
        </p>
      </div>
      <ul className="space-y-1">
        {matching.waiting.map((team) => {
          const selected =
            team.organizationId === matching.team?.organizationId;
          return (
            <li key={team.organizationId}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => matching.pickTeam(team.organizationId)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${
                  selected
                    ? "bg-[#fff4ec] shadow-[inset_3px_0_0_#e86f22]"
                    : "hover:bg-[#f7f8f9]"
                }`}
              >
                <Avatar initials={initials(team.name)} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] text-[#22262b]">
                    {team.name}
                  </span>
                  <span
                    className={`block truncate text-[12.5px] ${selected ? "text-[#c95c18]" : "text-[#858c96]"}`}
                  >
                    İhtiyaç: {needLabel(team)}
                  </span>
                </span>
                <StatusChip
                  tone={
                    team.waitingDays >= 4
                      ? "red"
                      : team.waitingDays >= 2
                        ? "amber"
                        : "neutral"
                  }
                >
                  {waitingLabel(team.waitingDays)}
                </StatusChip>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TeamPanel({
  matching,
  team,
}: {
  matching: Matching;
  team: WaitingTeam;
}) {
  const suggestions = matching.suggestions.data;
  return (
    <div className="min-w-0 space-y-5">
      <section className="rounded-[28px] border border-[#f6c9a5] bg-white p-5">
        <div className="flex items-start gap-3">
          <Avatar initials={initials(team.name)} size="lg" />
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-2 text-[18px] font-semibold text-[#22262b]">
              {team.name}
              <StatusChip tone="orange">Takım</StatusChip>
              <StatusChip tone="red">
                {team.waitingDays === 0
                  ? "bugün eklendi"
                  : `${team.waitingDays} gündür bekliyor`}
              </StatusChip>
            </h2>
            {teamMeta(team) ? (
              <p className="text-[13px] text-[#676e78]">{teamMeta(team)}</p>
            ) : null}
          </div>
        </div>
        <dl className="mt-4 grid gap-4 text-[13.5px] sm:grid-cols-2">
          <div>
            <dt className="text-[12px] text-[#858c96]">Mentorluk konusu</dt>
            <dd className="text-[#22262b]">{needLabel(team)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-[#858c96]">Mevcut ihtiyaç</dt>
            <dd className="text-[#22262b]">{team.needText ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[12px] text-[#858c96]">
          {NEED_SOURCE_NOTES[team.needSource]}
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-[#22262b]">
          Önerilen mentorlar{" "}
          <span className="text-[13px] font-normal text-[#858c96]">
            Uzmanlık ve takım ihtiyacına göre sıralandı
          </span>
        </h3>
        <div className="w-full sm:w-[320px]">
          <SearchField
            value={matching.search}
            onChange={matching.setSearch}
            placeholder="Havuzdan mentor ara ve manuel eşleştir"
          />
        </div>
      </div>

      <QueryNotice
        isLoading={matching.suggestions.isLoading}
        error={matching.suggestions.error}
      />
      {matching.search ? (
        matching.searchResults.length === 0 ? (
          <EmptyNote>Havuzda bu aramayla eşleşen mentor yok.</EmptyNote>
        ) : (
          <ul className="space-y-3" aria-label="Havuz arama sonuçları">
            {matching.searchResults.map((candidate) => (
              <CandidateCard
                key={candidate.mentorId}
                candidate={candidate}
                onMatch={() => matching.openConfirm(candidate)}
              />
            ))}
          </ul>
        )
      ) : suggestions && suggestions.recommended.length === 0 ? (
        <EmptyNote>
          Programın mentor havuzunda uygun mentor yok. Mentor Havuzu’ndan mentor
          davet edebilirsiniz.
        </EmptyNote>
      ) : (
        <ul className="space-y-3" aria-label="Önerilen mentorlar">
          {suggestions?.recommended.map((candidate, index) => (
            <CandidateCard
              key={candidate.mentorId}
              candidate={candidate}
              rank={index + 1}
              onMatch={() => matching.openConfirm(candidate)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  rank,
  onMatch,
}: {
  candidate: MatchCandidate;
  rank?: number;
  onMatch: () => void;
}) {
  const [open, setOpen] = useState(rank === 1);
  const full = isFull(candidate);
  return (
    <li
      className={`rounded-[24px] border bg-white p-5 ${rank === 1 ? "border-[#26a4ff]" : "border-[#e9ecef]"}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <Avatar initials={initials(candidate.fullName)} tone="blue" size="lg" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-[#22262b]">
            {candidate.fullName}
            <StatusChip tone="blue">Mentor</StatusChip>
            {rank ? (
              <span className="text-[12px] font-medium text-[#1a7fcc]">
                {rank}. öneri
              </span>
            ) : null}
          </p>
          <p className="truncate text-[12.5px] text-[#858c96]">
            {candidate.title || candidate.specialties.slice(0, 2).join(" · ")}
          </p>
        </div>
        <div className="w-[150px] text-[12px] text-[#858c96]">
          Müsaitlik
          <span className="mt-1 block">
            {full ? (
              <StatusChip tone="amber">Kapasite dolu</StatusChip>
            ) : (
              <span className="text-[12.5px] text-[#22262b]">
                {candidate.availability ?? "Belirtilmedi"}
              </span>
            )}
          </span>
        </div>
        <div className="w-[110px] text-[12px] text-[#858c96]">
          Yük · {candidate.activeTeams}/{candidate.capacity}
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#f0f2f4]">
            <span
              className={`block h-full rounded-full ${full ? "bg-[#ffa94d]" : "bg-[#26a4ff]"}`}
              style={{ width: `${loadShare(candidate)}%` }}
            />
          </span>
        </div>
        <button
          type="button"
          onClick={onMatch}
          aria-label={`${candidate.fullName} ile eşleştir`}
          className={`rounded-full px-4 py-2 text-[13px] font-medium ${
            full
              ? "border border-[#e9ecef] bg-white text-[#22262b]"
              : "bg-[#22262b] text-white"
          }`}
        >
          Eşleştir
        </button>
      </div>
      {candidate.reasons.length > 0 ? (
        <div className="mt-3 pl-[60px]">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1a7fcc]"
          >
            Neden uygun?
            <ChevronDown
              aria-hidden
              className={`size-3.5 transition ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open ? (
            <ul className="mt-2 space-y-1.5 rounded-2xl bg-[#f7f8f9] px-4 py-3 text-[13px] text-[#22262b]">
              {candidate.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <Check
                    aria-hidden
                    className="mt-0.5 size-3.5 shrink-0 text-[#1a7fcc]"
                  />
                  {reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function ConfirmDialog({
  matching,
  team,
  candidate,
}: {
  matching: Matching;
  team: WaitingTeam;
  candidate: MatchCandidate;
}) {
  const full = isFull(candidate);
  const fillsUp = candidate.activeTeams + 1 === candidate.capacity;
  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 grid h-dvh max-h-none w-screen max-w-none place-items-center bg-black/30 p-4"
      onClick={matching.closeConfirm}
    >
      <section
        aria-label="Eşleşmeyi onayla"
        className="w-full max-w-[600px] rounded-[28px] bg-white p-6 shadow-[0_16px_48px_rgba(33,38,43,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold text-[#22262b]">
              Eşleşmeyi onayla
            </h2>
            <p className="mt-1 text-[13.5px] text-[#676e78]">
              Onayladığında mentorluk hemen başlar ve iki tarafa bildirim gider.
            </p>
          </div>
          <button
            type="button"
            onClick={matching.closeConfirm}
            aria-label="Kapat"
            className="grid size-8 place-items-center rounded-full bg-[#f4f5f7] text-[#676e78]"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <div className="mt-5 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-2xl bg-[#fff4ec] p-4">
            <p className="text-[15px] font-semibold text-[#22262b]">
              {team.name}
            </p>
            <p className="text-[12.5px] text-[#c95c18]">
              Takım{team.leadName ? ` · ${team.leadName}` : ""}
            </p>
            <p className="mt-2 text-[13px] text-[#22262b]">
              İhtiyaç: {needLabel(team)}
            </p>
          </div>
          <ArrowLeftRight
            aria-hidden
            className="mx-auto size-4 text-[#858c96]"
          />
          <div className="rounded-2xl bg-[#eaf6ff] p-4">
            <p className="text-[15px] font-semibold text-[#22262b]">
              {candidate.fullName}
            </p>
            <p className="text-[12.5px] text-[#1a7fcc]">Mentor</p>
            <p className="mt-2 text-[13px] text-[#b7791f]">
              {loadAfterMatch(candidate)}
            </p>
          </div>
        </div>
        {full || fillsUp ? (
          <p
            role="alert"
            className="mt-4 flex gap-2 rounded-2xl bg-[#fff6e5] px-4 py-3 text-[13px] text-[#6b4a12]"
          >
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            {full
              ? `${candidate.fullName}’ın kapasitesi zaten dolu; bu eşleşmeyle kapasitesinin üzerine çıkacak.`
              : `Bu eşleşmeyle ${candidate.fullName}’ın kapasitesi dolacak.`}
          </p>
        ) : null}
        <fieldset className="mt-5 space-y-3 rounded-2xl border border-[#e9ecef] p-4">
          <legend className="sr-only">Eşleşmeyle birlikte</legend>
          <label className="flex items-center gap-2 text-[13.5px] text-[#22262b]">
            <input
              type="checkbox"
              checked={matching.introOn}
              onChange={(event) => matching.setIntroOn(event.target.checked)}
              className="size-4 accent-[#22262b]"
            />
            İlk tanışma görüşmesi öner
          </label>
          {matching.introOn ? (
            <div className="ml-6 space-y-1">
              <input
                type="datetime-local"
                required
                aria-label="Tanışma zamanı"
                value={matching.introAt}
                onChange={(event) => matching.setIntroAt(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13px]"
              />
              <p className="text-[12px] text-[#858c96]">
                {INTRO_MEETING_MINUTES} dk · mentor ve takım yetkilisi ayrı ayrı
                onaylar.
              </p>
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-[13.5px] text-[#22262b]">
            <input
              type="checkbox"
              checked={matching.noteOn}
              onChange={(event) => matching.setNoteOn(event.target.checked)}
              className="size-4 accent-[#22262b]"
            />
            Koordinatör notu ekle
          </label>
          {matching.noteOn ? (
            <textarea
              aria-label="Koordinatör notu"
              value={matching.note}
              onChange={(event) => matching.setNote(event.target.value)}
              maxLength={MAX_COORDINATOR_NOTE}
              rows={2}
              placeholder="Yalnızca koordinatörler görür."
              className="ml-6 w-[calc(100%-1.5rem)] rounded-xl border border-[#e9ecef] px-3 py-2 text-[13px]"
            />
          ) : null}
        </fieldset>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={matching.closeConfirm}
            className="rounded-full border border-[#e9ecef] px-5 py-2.5 text-[13.5px] text-[#22262b]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={matching.confirm}
            disabled={matching.matching}
            className="rounded-full bg-[#22262b] px-5 py-2.5 text-[13.5px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {matching.matching ? "Eşleştiriliyor…" : "Eşleşmeyi onayla"}
          </button>
        </div>
      </section>
    </dialog>
  );
}

function MatchList({
  matches,
  empty,
}: {
  matches: ProgramMatch[];
  empty: string;
}) {
  if (matches.length === 0) return <EmptyNote>{empty}</EmptyNote>;
  return (
    <ul className="divide-y divide-[#f0f2f4] rounded-[28px] border border-[#e9ecef] bg-white">
      {matches.map((match) => (
        <li
          key={match.mentorshipId}
          className="flex flex-wrap items-center gap-3 px-6 py-4 text-[14px]"
        >
          <span className="min-w-0 flex-1 text-[#22262b]">
            {match.teamName} ↔ {match.mentorName}
          </span>
          <span className="text-[12.5px] text-[#858c96]">
            {formatLongDate(match.startDate)}
            {match.endDate ? ` – ${formatLongDate(match.endDate)}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
