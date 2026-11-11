import { describe, expect, it } from "vitest";

import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { CALENDAR_SUPPORT_AREA } from "@/lib/const";
import {
  isCalendarOriginRequest,
  isFirstMeetingWithMentor,
  isProfileOriginRequest,
  meetingCounterpartName,
  meetingInviteeLabels,
  meetingScheduleLabel,
  programsForOrganization,
  requestAgendaLines,
  requestExpectedOutcome,
  splitContextLines,
  type MeetingContextTexts,
} from "@/lib/meeting-context";
import { program } from "@test/fixtures/program";
import { translatorIn } from "@test/translators";

const texts: MeetingContextTexts = {
  t: translatorIn("tr", "meetingPages.context"),
  locale: "tr",
};

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "m-1",
    organizationId: "org-1",
    mentorId: "mentor-1",
    scheduledAt: "2026-09-14T15:00:00+03:00",
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

/** A request picked from the calendar unless overridden: no profile match behind it. */
function request(
  overrides: Partial<MentorshipRequest> = {},
): MentorshipRequest {
  return {
    id: "req-1",
    requesterId: "u-1",
    organizationId: "org-1",
    mentorId: "mentor-1",
    mentorName: "Deniz Kaya",
    supportArea: "Finansman",
    status: MentorshipRequestStatus.Accepted,
    mentorMessage: null,
    rejectionReason: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    messages: [],
    recommendationSnapshot: null,
    ...overrides,
  };
}

describe("isCalendarOriginRequest", () => {
  it("treats a meeting without a request as booked from the calendar", () => {
    expect(isCalendarOriginRequest(null)).toBe(true);
    expect(isCalendarOriginRequest(undefined)).toBe(true);
    expect(isProfileOriginRequest(null)).toBe(false);
  });

  it.each([
    ["an empty support area", request({ supportArea: "  " })],
    [
      "the calendar's own support area",
      request({ supportArea: CALENDAR_SUPPORT_AREA }),
    ],
    [
      "the calendar's generated summary",
      request({ summary: "Finansman — Mentorluk Görüşmesi" }),
    ],
    ["a summary that only repeats the area", request({ summary: "Finansman" })],
  ])("counts a request with %s as calendar-made", (_label, value) => {
    expect(isCalendarOriginRequest(value)).toBe(true);
    expect(isProfileOriginRequest(value)).toBe(false);
  });

  it("counts a request with a written summary as one from the profile", () => {
    const written = request({ summary: "Yatırımcı sunumu hazırlığı" });

    expect(isCalendarOriginRequest(written)).toBe(false);
    expect(isProfileOriginRequest(written)).toBe(true);
  });

  it("counts a request with no summary at all as one from the profile", () => {
    expect(isCalendarOriginRequest(request({ summary: "" }))).toBe(false);
  });
});

describe("splitContextLines", () => {
  it.each([null, undefined, "", "   \n  "])("answers no lines for %j", (v) => {
    expect(splitContextLines(v)).toEqual([]);
  });

  it("drops list markers and blank lines from every line ending", () => {
    expect(
      splitContextLines("- Fiyat\r\n* Kanal\n\n• Ekip\n3) Yol haritası"),
    ).toEqual(["Fiyat", "Kanal", "Ekip", "Yol haritası"]);
  });
});

describe("meetingScheduleLabel", () => {
  const start = "2026-09-14T15:00:00+03:00";

  it("answers nothing for a meeting with an unreadable time", () => {
    expect(meetingScheduleLabel(meeting({ scheduledAt: "soon" }), texts)).toBe(
      "",
    );
  });

  it("writes the date instead of 'today' for another day", () => {
    const label = meetingScheduleLabel(
      meeting(),
      texts,
      new Date("2026-09-20T12:00:00+03:00"),
    );

    expect(label).not.toContain("Bugün");
    expect(label).toContain("2026");
    expect(label).toContain("15:00–15:45");
  });

  it.each([
    [MeetingStatus.Completed, "Tamamlandı"],
    [MeetingStatus.Cancelled, "İptal edildi"],
  ])("names a %s meeting by its status whatever the time", (status, word) => {
    const label = meetingScheduleLabel(
      meeting({ status }),
      texts,
      new Date("2026-09-14T15:10:00+03:00"),
    );

    expect(label.endsWith(word)).toBe(true);
  });

  it.each([
    ["before it starts", "2026-09-14T14:59:00+03:00", "Planlandı"],
    ["at its start", start, "Görüşme başladı"],
    ["at its end", "2026-09-14T15:45:00+03:00", "Görüşme başladı"],
    ["after it ends", "2026-09-14T15:46:00+03:00", "Süre doldu"],
  ])("names a scheduled meeting %s", (_label, now, word) => {
    const label = meetingScheduleLabel(meeting(), texts, new Date(now));

    expect(label.endsWith(word)).toBe(true);
  });

  it("assumes an hour for a meeting saved without a length", () => {
    const label = meetingScheduleLabel(
      meeting({ durationMinutes: 0 }),
      texts,
      new Date(start),
    );

    expect(label).toContain("15:00–16:00");
  });

  it("gives a meeting with a negative length at least a minute", () => {
    const label = meetingScheduleLabel(
      meeting({ durationMinutes: -30 }),
      texts,
      new Date(start),
    );

    expect(label).toContain("15:00–15:01");
  });
});

describe("meetingCounterpartName", () => {
  it("shows the mentor the request's startup first", () => {
    expect(
      meetingCounterpartName(
        meeting({ organizationName: "Meeting Org" }),
        request({ organizationName: "Orbit" }),
        true,
        texts,
      ),
    ).toBe("Orbit");
  });

  it("falls back through the meeting's startup, the requested-for name and the requester", () => {
    expect(
      meetingCounterpartName(
        meeting({ organizationName: "Nova" }),
        request(),
        true,
        texts,
      ),
    ).toBe("Nova");
    expect(
      meetingCounterpartName(
        meeting(),
        request({ requestedForName: "Ada", requesterName: "Can" }),
        true,
        texts,
      ),
    ).toBe("Ada");
    expect(
      meetingCounterpartName(
        meeting(),
        request({ requesterName: "Can" }),
        true,
        texts,
      ),
    ).toBe("Can");
  });

  it("calls the other side 'Girişim' when nothing names it", () => {
    expect(meetingCounterpartName(meeting(), null, true, texts)).toBe(
      "Girişim",
    );
  });

  it("shows the startup the meeting's mentor, then the request's, then 'Mentor'", () => {
    expect(
      meetingCounterpartName(
        meeting({ mentorName: "Leyla" }),
        request(),
        false,
        texts,
      ),
    ).toBe("Leyla");
    expect(meetingCounterpartName(meeting(), request(), false, texts)).toBe(
      "Deniz Kaya",
    );
    expect(meetingCounterpartName(meeting(), null, false, texts)).toBe(
      "Mentor",
    );
  });
});

describe("requestAgendaLines", () => {
  it("falls back to the meeting's agenda when the request has no summary", () => {
    expect(
      requestAgendaLines(
        request({ summary: "" }),
        meeting({ agenda: "- Bütçe\n- Ekip" }),
      ),
    ).toEqual(["Bütçe", "Ekip"]);
    expect(requestAgendaLines(null, meeting())).toEqual([]);
  });
});

describe("requestExpectedOutcome", () => {
  it("reads the outcome out of the message when the field is blank", () => {
    expect(
      requestExpectedOutcome(
        request({ expectedOutcome: "  ", requesterMessage: "İlk müşteri" }),
      ),
    ).toBe("İlk müşteri");
  });

  it("answers an empty outcome without a request", () => {
    expect(requestExpectedOutcome(null)).toBe("");
  });
});

describe("programsForOrganization", () => {
  it("answers no programs when none loaded", () => {
    expect(programsForOrganization(undefined, "org-1")).toEqual([]);
    expect(programsForOrganization([], "org-1")).toEqual([]);
  });

  it("keeps only the programs the startup is in", () => {
    const inIt = program({
      id: "prog-1",
      startups: [{ id: "org-1", name: "Orbit" }],
    });
    const notInIt = program({
      id: "prog-2",
      startups: [{ id: "org-2", name: "Nova" }],
    });

    expect(programsForOrganization([inIt, notInIt], "org-1")).toEqual([inIt]);
  });
});

describe("isFirstMeetingWithMentor", () => {
  const current = meeting({ id: "now" });

  it("counts a meeting without a mentor as a first meeting", () => {
    const withoutMentor: MeetingItem = {
      id: "m-9",
      organizationId: "org-1",
      scheduledAt: "2026-09-14T15:00:00+03:00",
      durationMinutes: 45,
      status: MeetingStatus.Scheduled,
    };

    expect(
      isFirstMeetingWithMentor(
        [meeting({ status: MeetingStatus.Completed })],
        withoutMentor,
      ),
    ).toBe(true);
  });

  it("is not the first once the pair has completed a meeting", () => {
    expect(
      isFirstMeetingWithMentor(
        [current, meeting({ id: "before", status: MeetingStatus.Completed })],
        current,
      ),
    ).toBe(false);
  });

  it.each([
    [
      "the meeting itself",
      meeting({ id: "now", status: MeetingStatus.Completed }),
    ],
    [
      "a cancelled meeting",
      meeting({ id: "before", status: MeetingStatus.Cancelled }),
    ],
    [
      "another startup's meeting",
      meeting({
        id: "before",
        organizationId: "org-2",
        status: MeetingStatus.Completed,
      }),
    ],
    [
      "another mentor's meeting",
      meeting({
        id: "before",
        mentorId: "mentor-2",
        status: MeetingStatus.Completed,
      }),
    ],
  ])("is still the first despite %s", (_label, other) => {
    expect(isFirstMeetingWithMentor([other], current)).toBe(true);
  });
});

describe("meetingInviteeLabels", () => {
  it("names a room entry without names by its roles, once", () => {
    expect(
      meetingInviteeLabels(
        [
          meeting({ mentorName: " ", organizationName: "" }),
          meeting({ id: "m-2" }),
        ],
        texts,
      ),
    ).toEqual(["Mentor · Startup"]);
  });
});
