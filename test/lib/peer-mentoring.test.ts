import { describe, expect, it } from "vitest";

import { AppointmentSide } from "@/interfaces/appointment";
import { BadgeCode, BadgeStatus } from "@/interfaces/badges";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { PeerMentorGateState } from "@/interfaces/peer-mentoring";
import {
  latestGateAward,
  PEER_REQUEST_STATUS_TONE,
  peerMentorGateState,
  peerMentoringSide,
} from "@/lib/peer-mentoring";

describe("peerMentoringSide", () => {
  it("opens Mentorluk Ver only for as=MENTOR", () => {
    expect(peerMentoringSide("MENTOR")).toBe(AppointmentSide.Mentor);
    expect(peerMentoringSide(null)).toBe(AppointmentSide.Mentee);
    expect(peerMentoringSide("mentor")).toBe(AppointmentSide.Mentee);
  });
});

describe("PEER_REQUEST_STATUS_TONE", () => {
  it("covers every status and never shows a waiting request as accepted", () => {
    expect(Object.keys(PEER_REQUEST_STATUS_TONE).sort()).toEqual(
      Object.values(MentorshipRequestStatus).sort(),
    );
    const accepted = PEER_REQUEST_STATUS_TONE[MentorshipRequestStatus.Accepted];
    expect(PEER_REQUEST_STATUS_TONE[MentorshipRequestStatus.Pending]).not.toBe(
      accepted,
    );
  });
});

describe("peerMentorGateState", () => {
  const active = { status: BadgeStatus.Active };
  const revoked = { status: BadgeStatus.Revoked };

  it("opens the mentor side for an active badge or MENTOR", () => {
    expect(
      peerMentorGateState({
        holdsMentor: false,
        iskurParticipant: true,
        gateAward: active,
      }),
    ).toBe(PeerMentorGateState.Earned);
    expect(
      peerMentorGateState({
        holdsMentor: true,
        iskurParticipant: false,
        gateAward: null,
      }),
    ).toBe(PeerMentorGateState.Earned);
  });

  it("says Rozet Yok to an İŞKUR student who never had the badge", () => {
    expect(
      peerMentorGateState({
        holdsMentor: false,
        iskurParticipant: true,
        gateAward: null,
      }),
    ).toBe(PeerMentorGateState.NoBadge);
  });

  // D4 seam: a revoked badge closes the mentor side, even for running mentorships.
  it("closes the mentor side after a revoke", () => {
    expect(
      peerMentorGateState({
        holdsMentor: false,
        iskurParticipant: true,
        gateAward: revoked,
      }),
    ).toBe(PeerMentorGateState.Revoked);
  });

  it("hides the mentor side from everyone else", () => {
    expect(
      peerMentorGateState({
        holdsMentor: false,
        iskurParticipant: false,
        gateAward: null,
      }),
    ).toBe(PeerMentorGateState.Hidden);
  });
});

describe("latestGateAward", () => {
  it("picks the newest Akran Mentoru award and ignores achievements", () => {
    expect(
      latestGateAward([
        {
          code: BadgeCode.PeerMentor,
          awardedAt: "2026-09-01T00:00:00Z",
          id: "old",
        },
        {
          code: BadgeCode.Sessions10,
          awardedAt: "2026-11-05T00:00:00Z",
          id: "achievement",
        },
        {
          code: BadgeCode.PeerMentor,
          awardedAt: "2026-11-01T00:00:00Z",
          id: "new",
        },
      ])?.id,
    ).toBe("new");
    expect(latestGateAward([])).toBeNull();
  });
});
