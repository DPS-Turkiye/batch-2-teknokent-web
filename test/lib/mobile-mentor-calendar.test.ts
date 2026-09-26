import { describe, expect, it } from "vitest";

import { agendaEntries, startsInLabel } from "@/lib/mobile-calendar";
import {
  mentorAgendaEntries,
  mentorEntryDetail,
} from "@/lib/mobile-mentor-calendar";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";

const NOW = new Date(2026, 8, 23, 16, 25);

const MEETING = menteeMeetingFixture({
  id: "m1",
  mentorshipRequestId: "r1",
  organizationId: "org-1",
  organizationName: "Döngü Labs",
  scheduledAt: new Date(2026, 8, 23, 16, 30).toISOString(),
  durationMinutes: 45,
  meetLink: "https://meet.google.com/abc",
  agenda: "değer önerisi",
});

const REQUEST = menteeRequestFixture({
  id: "r1",
  organizationId: "org-1",
  organizationName: "Döngü Labs",
  requesterName: "Gülse Buran",
  supportArea: "Positioning",
});

describe("mentorAgendaEntries", () => {
  it("names meetings by startup, topic and the person who asked", () => {
    const [entry] = mentorAgendaEntries(agendaEntries([MEETING], []), [
      REQUEST,
    ]);

    expect(entry).toMatchObject({
      title: "Döngü Labs",
      detail: "Positioning · Gülse Buran · Online",
      startup: { name: "Döngü Labs", initials: "DL" },
    });
  });

  it("falls back to the agenda when the request is not loaded", () => {
    const [entry] = mentorAgendaEntries(agendaEntries([MEETING], []), []);

    expect(entry?.detail).toBe("değer önerisi · Online");
  });
});

describe("mentorEntryDetail", () => {
  const [entry] = mentorAgendaEntries(agendaEntries([MEETING], []), [REQUEST]);

  it("builds the sheet with the team, the mentor and the topic", () => {
    expect(
      mentorEntryDetail({
        entry: entry!,
        meetings: [MEETING],
        requests: [REQUEST],
        members: [
          { id: "u1", fullName: "Gülse Buran", founder: true },
          { id: "u2", fullName: "Can Er" },
        ] as never,
        mentorName: "Nihan Öztürk",
        now: NOW,
      }),
    ).toEqual({
      title: "Döngü Labs · Positioning",
      startsIn: "5 dk sonra",
      timeLine: "Bugün · 16:30–17:15",
      timeHint: "45 dk",
      startup: {
        name: "Döngü Labs",
        initials: "DL",
        people: "Gülse Buran (yetkili) + 1 üye",
      },
      self: { name: "Nihan Öztürk", initials: "NÖ" },
      topic: {
        title: "Positioning · 1. görüşme",
        agenda: "Gündem: değer önerisi",
      },
    });
  });

  it("names the requester as lead until the members load, and drops the countdown once over", () => {
    const detail = mentorEntryDetail({
      entry: entry!,
      meetings: [MEETING],
      requests: [REQUEST],
      members: [],
      mentorName: "Nihan Öztürk",
      now: new Date(2026, 8, 23, 18, 0),
    });

    expect(detail?.startup.people).toBe("Gülse Buran (yetkili)");
    expect(detail?.startsIn).toBeNull();
  });
});

describe("startsInLabel", () => {
  it("counts down in minutes, hours and days", () => {
    const [entry] = agendaEntries([MEETING], []);

    expect(startsInLabel(entry!, NOW)).toBe("5 dk sonra");
    expect(startsInLabel(entry!, new Date(2026, 8, 23, 17, 0))).toBe("şimdi");
    expect(startsInLabel(entry!, new Date(2026, 8, 22, 16, 30))).toBe("yarın");
  });
});
