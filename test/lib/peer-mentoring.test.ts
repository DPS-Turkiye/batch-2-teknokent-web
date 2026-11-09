import { describe, expect, it } from "vitest";

import { AppointmentSide } from "@/interfaces/appointment";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import {
  PEER_REQUEST_STATUS_TONE,
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
