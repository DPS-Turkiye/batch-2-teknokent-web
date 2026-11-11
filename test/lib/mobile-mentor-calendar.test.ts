import { describe, expect, it } from "vitest";

import {
  MeetingProposalStatus,
  type MeetingProposal,
} from "@/interfaces/meeting-proposal";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { agendaEntries, startsInLabel } from "@/lib/mobile-calendar";
import {
  mentorAgendaEntries,
  mentorAwaitingEntries,
  mentorEntryDetail,
} from "@/lib/mobile-mentor-calendar";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { memberFixture } from "@test/fixtures/startup-team";
import { mobileTexts } from "@test/mobile-texts";

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

const MEMBERS = [
  memberFixture("u1", { fullName: "Gülse Buran", founder: true }),
  memberFixture("u2", { fullName: "Can Er" }),
];

describe("mentorAgendaEntries", () => {
  it("names meetings by startup, topic and the person who asked", () => {
    const [entry] = mentorAgendaEntries(
      agendaEntries([MEETING], [], mobileTexts()),
      [REQUEST],
      mobileTexts(),
    );

    expect(entry).toMatchObject({
      title: "Döngü Labs",
      detail: "Positioning · Gülse Buran · Online",
      startup: { name: "Döngü Labs", initials: "DL" },
    });
  });

  it("falls back to the agenda when the request is not loaded", () => {
    const [entry] = mentorAgendaEntries(
      agendaEntries([MEETING], [], mobileTexts()),
      [],
      mobileTexts(),
    );

    expect(entry?.detail).toBe("değer önerisi · Online");
  });
});

describe("mentorEntryDetail", () => {
  const [entry] = mentorAgendaEntries(
    agendaEntries([MEETING], [], mobileTexts()),
    [REQUEST],
    mobileTexts(),
  );

  it("builds the sheet with the team, the mentor and the topic", () => {
    expect(
      mentorEntryDetail({
        entry: entry!,
        meetings: [MEETING],
        requests: [REQUEST],
        members: MEMBERS,
        mentorName: "Nihan Öztürk",
        texts: mobileTexts(),
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

  it("builds the sheet's people, countdown and agenda in English", () => {
    const detail = mentorEntryDetail({
      entry: entry!,
      meetings: [MEETING],
      requests: [REQUEST],
      members: MEMBERS,
      mentorName: "Nihan Öztürk",
      texts: mobileTexts("en"),
      now: NOW,
    });

    expect(detail).toMatchObject({
      startsIn: "in 5 min",
      timeLine: "Today · 04:30 PM–05:15 PM",
      timeHint: "45 dk",
      startup: { people: "Gülse Buran (lead) + 1 member" },
      topic: {
        title: "Positioning · Meeting 1",
        agenda: "Agenda: değer önerisi",
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
      texts: mobileTexts(),
      now: new Date(2026, 8, 23, 18, 0),
    });

    expect(detail?.startup.people).toBe("Gülse Buran (yetkili)");
    expect(detail?.startsIn).toBeNull();
  });
});

describe("startsInLabel", () => {
  it("counts down in minutes, hours and days", () => {
    const [entry] = agendaEntries([MEETING], [], mobileTexts());

    const { t } = mobileTexts();
    expect(startsInLabel(entry!, NOW, t)).toBe("5 dk sonra");
    expect(startsInLabel(entry!, new Date(2026, 8, 23, 17, 0), t)).toBe(
      "şimdi",
    );
    expect(startsInLabel(entry!, new Date(2026, 8, 22, 16, 30), t)).toBe(
      "yarın",
    );
    expect(startsInLabel(entry!, NOW, mobileTexts("en").t)).toBe("in 5 min");
  });
});

describe("mentorAwaitingEntries", () => {
  const proposal = (overrides: Partial<MeetingProposal>) =>
    meetingProposal({
      id: "p1",
      organizationName: "Atlas AI",
      scheduledAt: new Date(2026, 8, 24, 11, 0).toISOString(),
      durationMinutes: 30,
      agenda: null,
      status: MeetingProposalStatus.Pending,
      canRespond: true,
      ...overrides,
    });

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
      mobileTexts(),
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
