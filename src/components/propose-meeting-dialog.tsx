"use client";

import {
  MAX_PROPOSAL_AGENDA,
  PROPOSAL_DURATIONS,
} from "@/lib/meeting-proposals";

/** What the dialog needs: the coordinator's proposal hook and the mentor/team reschedule hook both provide it. */
export type ProposalForm = {
  composing: boolean;
  closeComposer: () => void;
  rescheduling: boolean;
  startsAt: string;
  setStartsAt: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  agenda: string;
  setAgenda: (value: string) => void;
  canPropose: boolean;
  propose: () => void;
  proposeError: Error | null;
};

/** Picks the time, length and topic; both sides are asked to confirm it. */
export function ProposeMeetingDialog({
  proposals,
  pairLabel,
  note = "mentor ve takım yetkilisi ayrı ayrı onaylar.",
}: {
  proposals: ProposalForm;
  pairLabel: string;
  note?: string;
}) {
  if (!proposals.composing) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/30 p-4">
      <form
        role="dialog"
        aria-modal="true"
        aria-label={proposals.rescheduling ? "Yeni saat öner" : "Görüşme öner"}
        onSubmit={(event) => {
          event.preventDefault();
          proposals.propose();
        }}
        className="w-full max-w-[440px] rounded-[24px] bg-white p-6 shadow-[0_24px_60px_rgba(33,38,43,0.18)]"
      >
        <h3 className="text-[17px] font-semibold text-[#22262b]">
          {proposals.rescheduling ? "Yeni saat öner" : "Görüşme öner"}
        </h3>
        <p className="mt-1 text-[12.5px] text-[#858c96]">
          {pairLabel} · {note}
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
        {proposals.rescheduling ? null : (
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
        )}
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
