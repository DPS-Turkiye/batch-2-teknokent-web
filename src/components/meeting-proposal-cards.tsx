"use client";

import { CalendarClock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useMeetingProposals } from "@/hooks/use-meeting-proposals";
import type { MeetingProposal } from "@/interfaces/meeting-proposal";
import { proposalWhen } from "@/lib/meeting-proposals";

/** "Görüşme önerileri" on the mentor and team homes (from the coordinator or the other side); hidden when empty. */
export function MeetingProposalCards() {
  const t = useTranslations("meetingProposals");
  const proposals = useMeetingProposals();
  if (!proposals.proposals.length) return null;
  return (
    <section
      aria-label={t("title")}
      className="rounded-[22px] border border-[#e9ecef] bg-white p-5"
    >
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[#22262b]">
        <CalendarClock aria-hidden className="size-4" /> {t("title")}
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
  const t = useTranslations("meetingProposals");
  const locale = useLocale();
  const declining = proposals.decliningId === proposal.id;
  const side = (acceptedAt: string | null) =>
    acceptedAt ? t("accepted") : t("awaiting");
  return (
    <li className="rounded-2xl bg-[#f7f8f9] px-4 py-3">
      <p className="text-[13.5px] font-medium text-[#22262b]">
        {proposal.mentorName} ↔ {proposal.organizationName}
      </p>
      <p className="mt-0.5 text-[12.5px] text-[#22262b]">
        {t("when", {
          when: proposalWhen(proposal, locale),
          minutes: proposal.durationMinutes,
        })}
      </p>
      <p className="mt-0.5 text-[12px] text-[#858c96]">
        {[
          proposal.replacesMeetingId ? t("newTime") : null,
          proposal.agenda,
          proposal.proposedByName
            ? t("proposedBy", { name: proposal.proposedByName })
            : null,
          proposal.programName,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p className="mt-1 text-[12px] text-[#676e78]">
        {t("sides", {
          mentor: side(proposal.mentorAcceptedAt),
          team: side(proposal.teamAcceptedAt),
        })}
      </p>
      {proposal.canRespond && !declining ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => proposals.accept(proposal.id)}
            disabled={proposals.accepting === proposal.id}
            className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white disabled:bg-[#858c96]"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={() => proposals.startDecline(proposal.id)}
            className="inline-flex h-9 items-center rounded-full border border-[#e9ecef] bg-white px-4 text-[12.5px] font-medium text-[#22262b]"
          >
            {t("decline")}
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
            aria-label={t("reasonLabel")}
            placeholder={t("reasonPlaceholder")}
            rows={2}
            className="w-full rounded-xl border border-[#e9ecef] bg-white px-3 py-2 text-[12.5px] outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={proposals.declining}
              className="inline-flex h-9 items-center rounded-full bg-[#22262b] px-4 text-[12.5px] font-medium text-white disabled:bg-[#858c96]"
            >
              {t("notifyCoordinator")}
            </button>
            <button
              type="button"
              onClick={proposals.cancelDecline}
              className="inline-flex h-9 items-center rounded-full px-3 text-[12.5px] text-[#676e78]"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
