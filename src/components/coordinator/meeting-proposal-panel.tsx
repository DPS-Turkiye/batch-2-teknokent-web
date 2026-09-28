"use client";

import type { MentorshipMeetingProposals } from "@/hooks/use-meeting-proposals";
import { proposalWhenLabel, sideLabel } from "@/lib/meeting-proposals";

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
