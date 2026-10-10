import { describe, expect, it } from "vitest";

import {
  type MeetingProposal,
  MeetingProposalStatus,
} from "@/interfaces/meeting-proposal";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { agendaEntries, startsInLabel } from "@/lib/mobile-calendar";
import {
  mentorAgendaEntries,
  mentorAwaitingEntries,
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

describe("mentorAwaitingEntries", () => {
  const proposal = (overrides: Partial<MeetingProposal>) =>
    ({
      id: "p1",
      organizationName: "Atlas AI",
      scheduledAt: new Date(2026, 8, 24, 11, 0).toISOString(),
      durationMinutes: 30,
      agenda: null,
      status: MeetingProposalStatus.Pending,
      canRespond: true,
      ...overrides,
    }) as MeetingProposal;

  it("places proposals the mentor still answers and a new request's future slots", () => {
    const entries = mentorAwaitingEntries(
      [
        proposal({}),
        proposal({ id: "p2", canRespond: false }),
        proposal({ id: "p3", status: MeetingProposalStatus.Confirmed }),
      ],
      [
        menteeRequestFixture({
          id: "r2",
          status: MentorshipRequestStatus.Pending,
          organizationName: "Lumen",
          supportArea: "Finansal model",
          requesterMessage: "preferredSlots:2026-09-26T11:00,2026-09-22T10:00",
        }),
        menteeRequestFixture({
          id: "r3",
          status: MentorshipRequestStatus.Accepted,
          requesterMessage: "preferredSlots:2026-09-27T11:00",
        }),
      ],
      NOW,
    );

    expect(entries.map((entry) => entry.id)).toEqual([
      "proposal:p1",
      expect.stringMatching(/^request:r2:/),
    ]);
    expect(entries[0]).toMatchObject({
      title: "Atlas AI",
      detail: "Görüşme önerisi · önerilen saat · onay bekliyor",
      length: "30 dk",
      awaitingApproval: true,
      meeting: null,
    });
    expect(entries[1]).toMatchObject({
      title: "Lumen",
      time: "11:00",
      length: "45 dk",
      requestId: "r2",
    });
  });
});
