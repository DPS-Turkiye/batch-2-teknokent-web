"use client";

import { CalendarClock } from "lucide-react";

import { useMeetingProposals } from "@/hooks/use-meeting-proposals";
import type { MeetingProposal } from "@/interfaces/meeting-proposal";
import { proposalWhenLabel, sideLabel } from "@/lib/meeting-proposals";

/** "Koordinatör önerileri" on the mentor and team homes; hidden when nothing is waiting. */
export function MeetingProposalCards() {
  const proposals = useMeetingProposals();
  if (!proposals.proposals.length) return null;
  return (
    <section
      aria-label="Koordinatör önerileri"
      className="rounded-[22px] border border-[#e9ecef] bg-white p-5"
    >
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#22262b]">
        <CalendarClock aria-hidden className="size-4" /> Koordinatör önerileri
      </h2>
      {proposals.error ? (
        <p className="mt-2 text-[12px] text-[#d9464b]">
          {proposals.error.message}
        </p>
      ) : null}
      <ul className="mt-3 space-y-3">
        {proposals.proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            proposals={proposals}
          />
        ))}
      </ul>
    </section>
  );
}

function ProposalCard({
  proposal,
  proposals,
}: {
  proposal: MeetingProposal;
  proposals: ReturnType<typeof useMeetingProposals>;
}) {
  const declining = proposals.decliningId === proposal.id;
  return (
    <li className="rounded-2xl bg-[#f7f8f9] px-4 py-3">
      <p className="text-[13.5px] font-medium text-[#22262b]">
        {proposal.mentorName} ↔ {proposal.organizationName}
      </p>
      <p className="mt-0.5 text-[12.5px] text-[#22262b]">
        {proposalWhenLabel(proposal)}
      </p>
      <p className="mt-0.5 text-[12px] text-[#858c96]">
        {[
          proposal.replacesMeetingId ? "Yeni saat önerisi" : null,
          proposal.agenda,
          proposal.proposedByName ? `Öneren: ${proposal.proposedByName}` : null,
          proposal.programName,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p className="mt-1 text-[12px] text-[#676e78]">
        Mentor: {sideLabel(proposal.mentorAcceptedAt)} · Takım:{" "}
        {sideLabel(proposal.teamAcceptedAt)}
      </p>
      {proposal.canRespond && !declining ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => proposals.accept(proposal.id)}
            disabled={proposals.accepting === proposal.id}
            className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white disabled:bg-[#858c96]"
          >
            Onayla
          </button>
          <button
            type="button"
            onClick={() => proposals.startDecline(proposal.id)}
            className="inline-flex h-9 items-center rounded-full border border-[#e9ecef] bg-white px-4 text-[12.5px] font-medium text-[#22262b]"
          >
            Uygun değilim
          </button>
        </div>
      ) : null}
      {declining ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            proposals.confirmDecline();
          }}
        >
          <textarea
            value={proposals.reason}
            onChange={(event) => proposals.setReason(event.target.value)}
            aria-label="Neden uygun değilsin?"
            placeholder="Neden uygun değilsin? (isteğe bağlı)"
            rows={2}
            className="w-full rounded-xl border border-[#e9ecef] bg-white px-3 py-2 text-[12.5px] outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={proposals.declining}
              className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white disabled:bg-[#858c96]"
            >
              Koordinatöre bildir
            </button>
            <button
              type="button"
              onClick={proposals.cancelDecline}
              className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-[#676e78]"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
