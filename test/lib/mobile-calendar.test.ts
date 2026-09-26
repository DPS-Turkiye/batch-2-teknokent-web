import { describe, expect, it } from "vitest";

import {
  ProgramEventKind,
  type MemberProgramEvent,
} from "@/interfaces/coordinator-program";
import { MeetingStatus } from "@/interfaces/meeting";
import {
  agendaDays,
  agendaEntries,
  canJoin,
  dayHeading,
  entryTimeHint,
  entryTimeLine,
  eventRangeFor,
  meetingLinkLabel,
  MobileAgendaKind,
  monthCells,
  nextEntry,
  nextEntryLabel,
  weekStrip,
} from "@/lib/mobile-calendar";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";

// Wednesday 23 September 2026, 14:00.
const NOW = new Date(2026, 8, 23, 14, 0);

function programEvent(
  overrides: Partial<MemberProgramEvent> = {},
): MemberProgramEvent {
  return {
    id: "e1",
    programId: "p1",
    programName: "METU Stars 2026",
    title: "Ürün-Pazar Uyumu Atölyesi",
    kind: ProgramEventKind.Event,
    startsAt: new Date(2026, 8, 23, 16, 0).toISOString(),
    endsAt: new Date(2026, 8, 23, 17, 30).toISOString(),
    description: "Teknokent B-104",
    ...overrides,
  };
}

const MEETING = menteeMeetingFixture({
  id: "m1",
  mentorName: "Nihan Öztürk",
  organizationName: "Atlas AI",
  agenda: "Ürün Stratejisi Görüşmesi",
  scheduledAt: new Date(2026, 8, 24, 14, 0).toISOString(),
  durationMinutes: 60,
  meetLink: "https://meet.google.com/atl-nhn-5ks",
});

const DEADLINE = programEvent({
  id: "d1",
  title: "Ara rapor teslimi",
  kind: ProgramEventKind.Deadline,
  startsAt: new Date(2026, 8, 25, 23, 59).toISOString(),
  endsAt: null,
  description: null,
});

const ENTRIES = agendaEntries(
  [
    MEETING,
    menteeMeetingFixture({
      id: "gone",
      status: MeetingStatus.Cancelled,
      scheduledAt: new Date(2026, 8, 23, 9, 0).toISOString(),
    }),
  ],
  [programEvent(), DEADLINE],
);

describe("agendaEntries", () => {
  it("turns meetings, events and deadlines into time-ordered entries and drops cancelled meetings", () => {
    expect(
      ENTRIES.map((entry) => [entry.kind, entry.title, entry.length]),
    ).toEqual([
      [MobileAgendaKind.Event, "Ürün-Pazar Uyumu Atölyesi", "90 dk"],
      [MobileAgendaKind.Meeting, "Ürün Stratejisi Görüşmesi", "60 dk"],
      [MobileAgendaKind.Deadline, "Ara rapor teslimi", "Son tarih"],
    ]);
    expect(ENTRIES.map((entry) => entry.detail)).toEqual([
      "Program etkinliği · Teknokent B-104",
      "Nihan Öztürk ↔ Atlas AI · Online",
      "METU Stars 2026 · son tarih",
    ]);
  });
});

describe("weekStrip", () => {
  it("lays out Monday to Sunday with today selected and each day's kinds", () => {
    const strip = weekStrip(new Date(2026, 8, 23), ENTRIES, NOW);

    expect(strip.map((day) => `${day.weekday} ${day.dayNumber}`)).toEqual([
      "Pzt 21",
      "Sal 22",
      "Çar 23",
      "Per 24",
      "Cum 25",
      "Cmt 26",
      "Paz 27",
    ]);
    expect(strip[2]).toMatchObject({ isToday: true, isSelected: true });
    expect(strip[3]?.kinds).toEqual([MobileAgendaKind.Meeting]);
    expect(strip[5]?.isWeekend).toBe(true);
  });
});

describe("agendaDays and dayHeading", () => {
  it("lists the selected day and the rest of its week that have entries", () => {
    const days = agendaDays(new Date(2026, 8, 23), ENTRIES, NOW);

    expect(days.map((day) => day.heading)).toEqual([
      "Bugün · Çarşamba 23 Eylül",
      "Yarın · Perşembe 24 Eylül",
      "Cuma 25 Eylül",
    ]);
  });

  it("starts from a later selected day", () => {
    expect(
      agendaDays(new Date(2026, 8, 25), ENTRIES, NOW).map((day) => day.heading),
    ).toEqual(["Cuma 25 Eylül"]);
    expect(dayHeading(new Date(2026, 8, 30), NOW)).toBe("Çarşamba 30 Eylül");
  });
});

describe("next entry", () => {
  it("picks the first unfinished entry and says how soon it starts", () => {
    const next = nextEntry(ENTRIES, NOW);

    expect(next?.title).toBe("Ürün-Pazar Uyumu Atölyesi");
    expect(nextEntryLabel(next!, NOW)).toBe("Sıradaki · 2 saat sonra");
    expect(nextEntryLabel(next!, new Date(2026, 8, 23, 15, 45))).toBe(
      "Sıradaki · 15 dk sonra",
    );
    expect(nextEntryLabel(ENTRIES[1]!, NOW)).toBe("Sıradaki · yarın");
  });
});

describe("canJoin", () => {
  const meeting = ENTRIES[1]!;

  it("opens the link ten minutes before the start and closes it at the end", () => {
    expect(canJoin(meeting, new Date(2026, 8, 24, 13, 49))).toBe(false);
    expect(canJoin(meeting, new Date(2026, 8, 24, 13, 50))).toBe(true);
    expect(canJoin(meeting, new Date(2026, 8, 24, 15, 0))).toBe(false);
  });

  it("never opens a meeting without a link", () => {
    const [entry] = agendaEntries(
      [menteeMeetingFixture({ scheduledAt: NOW.toISOString() })],
      [],
    );

    expect(canJoin(entry!, NOW)).toBe(false);
  });
});

describe("detail texts", () => {
  it("describes the time and the link", () => {
    const meeting = ENTRIES[1]!;

    expect(entryTimeLine(meeting)).toBe("Perşembe 24 Eylül · 14:00–15:00");
    expect(entryTimeHint(meeting, NOW)).toBe("60 dk · yarın");
    expect(meetingLinkLabel("https://meet.google.com/abc")).toBe("Google Meet");
    expect(meetingLinkLabel("https://zoom.us/j/1")).toBe("zoom.us");
  });
});

describe("month helpers", () => {
  it("marks the month's days and fetches a week either side", () => {
    const cells = monthCells(
      new Date(2026, 8, 1),
      ENTRIES,
      new Date(2026, 8, 23),
      NOW,
    );
    const today = cells.find((cell) => cell.isToday);

    expect(cells[0]?.date.getDay()).toBe(1);
    expect(today?.kinds).toEqual([MobileAgendaKind.Event]);
    expect(eventRangeFor(new Date(2026, 8, 15))).toEqual({
      from: new Date(2026, 7, 25),
      to: new Date(2026, 9, 8),
    });
  });
});
