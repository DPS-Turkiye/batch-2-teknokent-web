"use client";

import type { MentorshipMeetingProposals } from "@/hooks/use-meeting-proposals";
import {
  MAX_PROPOSAL_AGENDA,
  PROPOSAL_DURATIONS,
  proposalWhenLabel,
  sideLabel,
} from "@/lib/meeting-proposals";

/** The drawer's "Görüşme önerisi" block: the open proposal and who has confirmed it, or the last decline. */
export function MeetingProposalPanel({
  proposals,
}: {
  proposals: MentorshipMeetingProposals;
}) {
  const open = proposals.open;
  const declined = proposals.declined;
  return (
    <div className="rounded-2xl border border-[#e9ecef] p-4">
      {open ? (
        <>
          <p className="text-[13.5px] font-medium text-[#22262b]">
            {proposalWhenLabel(open)}
          </p>
          {open.agenda ? (
            <p className="mt-0.5 text-[12px] text-[#858c96]">{open.agenda}</p>
          ) : null}
          <ul className="mt-2 space-y-1 text-[12.5px]">
            <li>
              {open.mentorName}:{" "}
              <SideState acceptedAt={open.mentorAcceptedAt} />
            </li>
            <li>
              {open.organizationName}:{" "}
              <SideState acceptedAt={open.teamAcceptedAt} />
            </li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={proposals.remind}
              disabled={proposals.reminding || proposals.reminded}
              className="inline-flex h-9 items-center rounded-full border border-[#e9ecef] px-4 text-[12.5px] font-medium text-[#22262b] disabled:text-[#aeb4bc]"
            >
              {proposals.reminded ? "Hatırlatıldı" : "Hatırlat"}
            </button>
            <button
              type="button"
              onClick={proposals.withdraw}
              disabled={proposals.withdrawing}
              className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-[#676e78] disabled:text-[#aeb4bc]"
            >
              Öneriyi geri çek
            </button>
          </div>
        </>
      ) : (
        <>
          {declined ? (
            <p className="mb-3 rounded-xl bg-[#fdeeee] px-3 py-2 text-[12.5px] text-[#22262b]">
              {declined.declinedByName ?? "Bir taraf"},{" "}
              {proposalWhenLabel(declined)} önerisine uygun olmadığını söyledi
              {declined.declineReason ? `: “${declined.declineReason}”` : "."}
            </p>
          ) : (
            <p className="mb-3 text-[12.5px] text-[#858c96]">
              Açık bir görüşme önerisi yok.
            </p>
          )}
          <button
            type="button"
            onClick={proposals.openComposer}
            className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white"
          >
            Görüşme planla
          </button>
        </>
      )}
      {proposals.actionError ? (
        <p className="mt-2 text-[12px] text-[#d9464b]">
          {proposals.actionError.message}
        </p>
      ) : null}
    </div>
  );
}

function SideState({ acceptedAt }: { acceptedAt: string | null }) {
  return (
    <span className={acceptedAt ? "text-[#1f8a4c]" : "text-[#b7791f]"}>
      {sideLabel(acceptedAt)}
    </span>
  );
}

/** Picks the time, length and topic; both sides are asked to confirm it. */
export function ProposeMeetingDialog({
  proposals,
  pairLabel,
}: {
  proposals: MentorshipMeetingProposals;
  pairLabel: string;
}) {
  if (!proposals.composing) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/30 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Görüşme öner"
        onSubmit={(event) => {
          event.preventDefault();
          proposals.propose();
        }}
        className="w-full max-w-[440px] rounded-[24px] bg-white p-6 shadow-[0_24px_60px_rgba(33,38,43,0.18)]"
      >
        <h3 className="text-[17px] font-semibold text-[#22262b]">
          Görüşme öner
        </h3>
        <p className="mt-1 text-[12.5px] text-[#858c96]">
          {pairLabel} · mentor ve takım yetkilisi ayrı ayrı onaylar.
        </p>
        <label className="mt-4 block text-[12.5px] font-medium text-[#22262b]">
          Tarih ve saat
          <input
            type="datetime-local"
            required
            value={proposals.startsAt}
            onChange={(event) => proposals.setStartsAt(event.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13px] font-normal"
          />
        </label>
        <label className="mt-3 block text-[12.5px] font-medium text-[#22262b]">
          Süre
          <select
            value={proposals.duration}
            onChange={(event) =>
              proposals.setDuration(Number(event.target.value))
            }
            className="mt-1 h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13px] font-normal"
          >
            {PROPOSAL_DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} dk
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-[12.5px] font-medium text-[#22262b]">
          Konu (isteğe bağlı)
          <input
            value={proposals.agenda}
            onChange={(event) => proposals.setAgenda(event.target.value)}
            maxLength={MAX_PROPOSAL_AGENDA}
            placeholder="Örn. Nakit akışı modeli"
            className="mt-1 h-10 w-full rounded-xl border border-[#e9ecef] px-3 text-[13px] font-normal"
          />
        </label>
        {proposals.proposeError ? (
          <p className="mt-3 text-[12px] text-[#d9464b]">
            {proposals.proposeError.message}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={proposals.closeComposer}
            className="inline-flex h-10 items-center rounded-full px-4 text-[13px] text-[#676e78]"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={!proposals.canPropose}
            className="inline-flex h-10 items-center rounded-full bg-[#22262b] px-4 text-[13px] font-medium text-white disabled:bg-[#858c96]"
          >
            İki tarafa öner
          </button>
        </div>
      </form>
    </div>
  );
}
