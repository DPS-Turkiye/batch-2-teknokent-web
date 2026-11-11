import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import {
  isProfileOriginRequest,
  meetingCallHref,
  meetingInviteeLabels,
  meetingScheduleLabel,
  requestAgendaLines,
  requestExpectedOutcome,
  splitContextLines,
  type MeetingContextTexts,
} from "@/lib/meeting-context";
import { translatorIn } from "@test/translators";

function contextTexts(locale: "tr" | "en"): MeetingContextTexts {
  return {
    t: translatorIn(locale, "meetingPages.context"),
    locale,
  };
}
const texts = contextTexts("tr");

const meeting: MeetingItem = {
  id: "m-1",
  organizationId: "org-1",
  mentorId: "mentor-1",
  mentorName: "Deniz Kaya",
  scheduledAt: "2026-09-14T15:00:00+03:00",
  durationMinutes: 45,
  agenda: "Takvim gündemi",
  status: MeetingStatus.Scheduled,
};

function request(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "req-1",
    requesterId: "u-1",
    organizationId: "org-1",
    mentorId: "mentor-1",
    mentorName: "Deniz Kaya",
    supportArea: "İş modeli ve strateji",
    summary: "Finansal modeli netleştiremiyoruz.",
    requesterMessage: "İlk varsayımları çıkarmak.\nTercih edilen saatler: ...",
    status: MentorshipRequestStatus.Accepted,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    messages: [],
    recommendationSnapshot: {
      matchingMethod: "PROFILE",
      matchingModel: null,
      generatedAt: "2026-09-01T10:00:00.000Z",
      startupName: "Nova",
      startupSector: null,
      startupStage: null,
      startupSummary: null,
      startupTechnologies: [],
    },
    ...overrides,
  };
}

describe("meeting-context helpers", () => {
  it("reads the stored expected outcome, falling back to the message on older requests", () => {
    expect(
      requestExpectedOutcome(
        request({
          expectedOutcome: " İlk finansal model ",
          requesterMessage: "Eski metin",
        }),
      ),
    ).toBe("İlk finansal model");
    expect(
      requestExpectedOutcome(
        request({
          expectedOutcome: null,
          requesterMessage:
            "Eski metin\nTercih edilen saatler: 2026-09-11|10:30",
        }),
      ),
    ).toBe("Eski metin");
    expect(requestExpectedOutcome(null)).toBe("");
  });

  it("builds the call page href", () => {
    expect(meetingCallHref("abc")).toBe("/meetings/research?id=abc");
  });

  it("detects profile-origin requests", () => {
    expect(isProfileOriginRequest(request())).toBe(true);
    expect(
      isProfileOriginRequest(
        request({
          supportArea: "Takvim toplantısı",
          summary: "Takvim toplantısı",
          recommendationSnapshot: null,
        }),
      ),
    ).toBe(false);
    expect(
      isProfileOriginRequest(
        request({
          supportArea: "Haftalık check-in",
          summary: "Haftalık check-in",
          mentorMessage: "Takvimden oluşturuldu",
          recommendationSnapshot: null,
        }),
      ),
    ).toBe(false);
  });

  it("splits agenda lines from the request summary", () => {
    expect(
      requestAgendaLines(
        request({
          summary: "Maliyet yapısı\nPricing varsayımları",
        }),
        meeting,
      ),
    ).toEqual(["Maliyet yapısı", "Pricing varsayımları"]);
    expect(splitContextLines("1. A\n2. B")).toEqual(["A", "B"]);
  });

  it("formats the schedule label for today", () => {
    const label = meetingScheduleLabel(
      meeting,
      texts,
      new Date("2026-09-14T12:00:00+03:00"),
    );
    expect(label).toContain("Bugün");
    expect(label).toContain("15:00");
    expect(label).toContain("15:45");
  });

  it("formats the schedule label in English", () => {
    const label = meetingScheduleLabel(
      meeting,
      contextTexts("en"),
      new Date("2026-09-14T12:00:00+03:00"),
    );
    expect(label).toContain("Today");
    expect(label).toContain("Scheduled");
  });

  it("lists unique room invitees", () => {
    expect(
      meetingInviteeLabels(
        [
          {
            ...meeting,
            mentorName: "Deniz Kaya",
            organizationName: "Nova",
          },
          {
            ...meeting,
            id: "m-2",
            mentorName: "Deniz Kaya",
            organizationName: "Nova",
          },
          {
            ...meeting,
            id: "m-3",
            mentorName: "Ayşe",
            organizationName: "Orbit",
          },
        ],
        texts,
      ),
    ).toEqual(["Deniz Kaya · Nova", "Ayşe · Orbit"]);
  });
});
