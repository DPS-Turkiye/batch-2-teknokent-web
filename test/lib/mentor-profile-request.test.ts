import { beforeEach, describe, expect, it } from "vitest";

import {
  meetingModeForMentor,
  mentorFirstName,
  mentorProfileHref,
  profileMentorshipSubmission,
} from "@/lib/mentor-profile-request";
import { writeNeedDraft } from "@/lib/mentor-request-need";
import { MentorMeetingMode } from "@/types/mentor-request";
import { mentorProfile } from "@test/fixtures/mentors";

const startup = {
  organizationId: "org-1",
  name: "Team TNT",
  summary: "SaaS",
  sector: "Yazılım",
  stage: "Fikir",
  technologies: ["Next.js"],
  confirmedProfile: true,
};

describe("mentor-profile-request", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it("uses the first name in the Figma CTA copy", () => {
    expect(mentorFirstName("Çağrı Yılmaz")).toBe("Çağrı");
    expect(mentorFirstName("Dr. Kemal Arslan")).toBe("Kemal");
  });

  it("points every mentee profile link at /mentors/[id]", () => {
    expect(mentorProfileHref(mentorProfile.id)).toBe(
      `/mentors/${mentorProfile.id}`,
    );
  });

  it("maps meeting mode labels onto the request enum", () => {
    expect(meetingModeForMentor("Online")).toBe(MentorMeetingMode.Online);
    expect(meetingModeForMentor("Yüz yüze / ofis")).toBe(
      MentorMeetingMode.InPerson,
    );
  });

  it("builds a request for this mentor, including preferred times", () => {
    writeNeedDraft({
      topicId: "finance",
      otherSummary: "",
      situationId: "onboarding",
      noneSummary: "",
      goalIds: ["next-steps"],
      goalNote: "",
    });

    const payload = profileMentorshipSubmission({
      mentor: mentorProfile,
      startup,
      requestedForName: "Sudenaz Yılmaz",
      preferredSlots: [
        { date: "2026-09-10", time: "10:00" },
        { date: "2026-09-10", time: "10:30" },
        { date: "2026-09-11", time: "14:00" },
      ],
    });

    expect(payload.mentorId).toBe(mentorProfile.id);
    expect(payload.supportArea).toBe("İş modeli ve strateji");
    expect(payload.requesterMessage).toContain(
      "Tercih edilen saatler: 10 Eylül Perşembe · 10:00, 10 Eylül Perşembe · 10:30, 11 Eylül Cuma · 14:00",
    );
    expect(payload.requesterMessage).toContain(
      "preferredSlots:2026-09-10T10:00,2026-09-10T10:30,2026-09-11T14:00",
    );
    expect(payload.recommendationSnapshot.recommendations).toEqual([
      expect.objectContaining({
        mentorId: mentorProfile.id,
        selected: true,
      }),
    ]);
  });

  it("sends the expected outcome as its own field, leaving only the times in the message", () => {
    const payload = profileMentorshipSubmission({
      mentor: mentorProfile,
      startup,
      requestedForName: "Sudenaz Yılmaz",
      problem: "Finansal modeli kuramıyoruz.",
      outcome: "  İlk finansal modelin çerçevesi  ",
      preferredSlots: [{ date: "2026-09-10", time: "10:00" }],
    });

    expect(payload.expectedOutcome).toBe("İlk finansal modelin çerçevesi");
    expect(payload.requesterMessage).not.toContain("finansal");
    expect(payload.requesterMessage).toContain("Tercih edilen saatler:");
  });
});
