import { describe, expect, it } from "vitest";

import { MeetingStatus } from "@/interfaces/meeting";
import { MeetingProposalStatus } from "@/interfaces/meeting-proposal";
import {
  canReschedule,
  defaultProposalStart,
  introStep,
  lastDeclined,
  openProposal,
  proposalWhenLabel,
  StepState,
  type ProposalTexts,
} from "@/lib/meeting-proposals";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import { translatorIn } from "@test/translators";

function texts(locale: "tr" | "en"): ProposalTexts {
  return {
    t: translatorIn(locale, "meetingProposals"),
    locale,
  };
}
const trTexts = texts("tr");

describe("meeting proposal helpers", () => {
  it("labels the time with the length", () => {
    expect(proposalWhenLabel(meetingProposal(), trTexts)).toBe(
      "1 Ekim Perşembe 10:30 · 45 dk",
    );
    expect(proposalWhenLabel(meetingProposal(), texts("en"))).toBe(
      "Thursday, October 1 at 10:30 AM · 45 min",
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

  it("defaults a new proposal to tomorrow at 10:00", () => {
    const start = defaultProposalStart(new Date(2026, 8, 27, 15, 42));
    expect([start.getDate(), start.getHours(), start.getMinutes()]).toEqual([
      28, 10, 0,
    ]);
  });

  it("turns the newest proposal into the İlk adımlar meeting step", () => {
    expect(introStep(null, trTexts)).toEqual({
      state: StepState.Todo,
      detail: "Henüz önerilmedi",
    });
    expect(introStep(meetingProposal(), trTexts).state).toBe(StepState.Waiting);
    expect(
      introStep(
        meetingProposal({ status: MeetingProposalStatus.Confirmed }),
        trTexts,
      ).state,
    ).toBe(StepState.Done);
    expect(
      introStep(
        meetingProposal({
          status: MeetingProposalStatus.Declined,
          declineReason: "Seyahatteyim",
        }),
        trTexts,
      ),
    ).toEqual({
      state: StepState.Todo,
      detail: "1 Ekim Perşembe 10:30 · 45 dk önerisi reddedildi: Seyahatteyim",
    });
    expect(introStep(null, texts("en")).detail).toBe("Not proposed yet");
  });

  it("only moves a planned meeting that hasn't started", () => {
    const now = new Date("2026-09-28T09:00:00Z");
    const upcoming = menteeMeetingFixture({
      scheduledAt: "2026-09-29T09:00:00Z",
    });
    expect(canReschedule(upcoming, now)).toBe(true);
    expect(
      canReschedule({ ...upcoming, scheduledAt: "2026-09-27T09:00:00Z" }, now),
    ).toBe(false);
    expect(
      canReschedule({ ...upcoming, status: MeetingStatus.Completed }, now),
    ).toBe(false);
  });
});
