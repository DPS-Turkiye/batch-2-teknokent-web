import { describe, expect, it } from "vitest";

import { MeetingProposalStatus } from "@/interfaces/meeting-proposal";
import {
  defaultProposalStart,
  introStep,
  StepState,
  lastDeclined,
  openProposal,
  proposalWhenLabel,
  sideLabel,
} from "@/lib/meeting-proposals";
import { meetingProposal } from "@test/fixtures/meeting-proposals";

describe("meeting proposal helpers", () => {
  it("labels the time in Istanbul with the length", () => {
    expect(proposalWhenLabel(meetingProposal())).toBe(
      "1 Ekim Perşembe 10:30 · 45 dk",
    );
  });

  it("finds the open proposal and only a newest decline", () => {
    const declined = meetingProposal({
      id: "p2",
      status: MeetingProposalStatus.Declined,
    });
    const confirmed = meetingProposal({
      id: "p3",
      status: MeetingProposalStatus.Confirmed,
    });

    expect(openProposal([declined, meetingProposal()])?.id).toBe("proposal-1");
    expect(openProposal([declined])).toBeNull();
    expect(lastDeclined([declined, confirmed])?.id).toBe("p2");
    expect(lastDeclined([confirmed, declined])).toBeNull();
  });

  it("says whether a side has answered", () => {
    expect(sideLabel(null)).toBe("Yanıt bekleniyor");
    expect(sideLabel("2026-09-27T09:00:00Z")).toBe("Onayladı");
  });

  it("defaults a new proposal to tomorrow at 10:00", () => {
    const start = defaultProposalStart(new Date(2026, 8, 27, 15, 42));
    expect([start.getDate(), start.getHours(), start.getMinutes()]).toEqual([
      28, 10, 0,
    ]);
  });

  it("turns the newest proposal into the İlk adımlar meeting step", () => {
    expect(introStep(null)).toEqual({
      state: StepState.Todo,
      detail: "Henüz önerilmedi",
    });
    expect(introStep(meetingProposal()).state).toBe(StepState.Waiting);
    expect(
      introStep(meetingProposal({ status: MeetingProposalStatus.Confirmed }))
        .state,
    ).toBe(StepState.Done);
    expect(
      introStep(
        meetingProposal({
          status: MeetingProposalStatus.Declined,
          declineReason: "Seyahatteyim",
        }),
      ),
    ).toEqual({
      state: StepState.Todo,
      detail: "1 Ekim Perşembe 10:30 · 45 dk önerisi reddedildi: Seyahatteyim",
    });
  });
});
