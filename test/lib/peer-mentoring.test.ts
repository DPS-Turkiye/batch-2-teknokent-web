import { beforeEach, describe, expect, it } from "vitest";

import { AppointmentSide } from "@/interfaces/appointment";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  createPeerMentoringRequest,
  getPeerMentoringRequests,
  getPeerMentors,
} from "@/lib/client/peer-mentoring";
import { resetPeerMentoringFixtures } from "@/lib/client/fixtures/peer-mentoring";
import {
  PEER_REQUEST_STATUS_TONE,
  peerMentoringSide,
} from "@/lib/peer-mentoring";

beforeEach(() => resetPeerMentoringFixtures());

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

describe("peer-mentoring client on fixtures", () => {
  it("filters mentors by category and by text, ignoring case", async () => {
    const international = await getPeerMentors({
      category: PeerTopicCategory.International,
      query: "",
    });
    expect(international.map((mentor) => mentor.fullName)).toEqual([
      "Elif Şahin",
    ]);
    const byText = await getPeerMentors({ category: null, query: "ERASMUS" });
    expect(byText.map((mentor) => mentor.fullName)).toEqual(["Elif Şahin"]);
  });

  it("adds a sent request on top of the list as pending", async () => {
    await createPeerMentoringRequest({
      mentorId: "fixture-peer-1",
      category: PeerTopicCategory.CareerInternship,
      message: "Staj başvurusu için CV'me bakabilir misin?",
    });
    const [latest] = await getPeerMentoringRequests();
    expect(latest.mentor.fullName).toBe("Deniz Kaya");
    expect(latest.status).toBe(MentorshipRequestStatus.Pending);
  });
});
