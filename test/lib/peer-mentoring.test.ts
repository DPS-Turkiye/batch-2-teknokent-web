import { describe, expect, it } from "vitest";

import { AppointmentSide } from "@/interfaces/appointment";
import { BadgeCode, BadgeStatus } from "@/interfaces/badges";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { PeerMentorGateState } from "@/interfaces/peer-mentoring";
import {
  iskurHomeMode,
  latestGateAward,
  PEER_REQUEST_STATUS_TONE,
  peerMentorCapacity,
  peerMentorGateState,
  peerMentoringSide,
} from "@/lib/peer-mentoring";
import { IskurHomeMode, PeerCapacityNote } from "@/types/iskur-student";

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

describe("peerMentorCapacity", () => {
  it("has no bar while no capacity is set (null, zero or negative)", () => {
    expect(peerMentorCapacity(2, null)).toEqual({
      used: 2,
      capacity: null,
      filled: 2,
      percent: 0,
      note: PeerCapacityNote.Unset,
    });
    expect(peerMentorCapacity(0, 0).note).toBe(PeerCapacityNote.Unset);
    expect(peerMentorCapacity(1, -3).note).toBe(PeerCapacityNote.Unset);
  });

  it("warns when accepting one more request fills the last place", () => {
    expect(peerMentorCapacity(3, 4)).toEqual({
      used: 3,
      capacity: 4,
      filled: 3,
      percent: 75,
      note: PeerCapacityNote.LastPlace,
    });
    expect(peerMentorCapacity(0, 1).note).toBe(PeerCapacityNote.LastPlace);
  });

  it("stays open with places to spare and never rounds an open capacity up to a full bar", () => {
    expect(peerMentorCapacity(1, 4).note).toBe(PeerCapacityNote.Open);
    expect(peerMentorCapacity(1, 3).percent).toBe(33);
    expect(peerMentorCapacity(198, 200)).toMatchObject({
      percent: 99,
      note: PeerCapacityNote.Open,
    });
  });

  it("is full at capacity, and holds the bar at capacity when a lowered capacity leaves extra mentees", () => {
    expect(peerMentorCapacity(4, 4)).toMatchObject({
      filled: 4,
      percent: 100,
      note: PeerCapacityNote.Full,
    });
    expect(peerMentorCapacity(5, 4)).toEqual({
      used: 5,
      capacity: 4,
      filled: 4,
      percent: 100,
      note: PeerCapacityNote.Full,
    });
  });
});

describe("iskurHomeMode", () => {
  it("adds nothing for students who cannot give peer mentoring or lost the badge", () => {
    expect(iskurHomeMode(PeerMentorGateState.Hidden, false)).toBe(
      IskurHomeMode.None,
    );
    expect(iskurHomeMode(PeerMentorGateState.Revoked, true)).toBe(
      IskurHomeMode.None,
    );
  });

  it("points to the training, then the wizard, then shows the mentor blocks", () => {
    expect(iskurHomeMode(PeerMentorGateState.NoBadge, false)).toBe(
      IskurHomeMode.Training,
    );
    expect(iskurHomeMode(PeerMentorGateState.Earned, false)).toBe(
      IskurHomeMode.CreateProfile,
    );
    expect(iskurHomeMode(PeerMentorGateState.Earned, true)).toBe(
      IskurHomeMode.Mentor,
    );
  });
});
