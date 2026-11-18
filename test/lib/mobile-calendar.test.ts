import { describe, expect, it } from "vitest";

import {
  ProgramCalendarEntryKind,
  type MemberProgramEvent,
} from "@/interfaces/coordinator-program";
import { MeetingStatus } from "@/interfaces/meeting";
import {
  agendaDays,
  agendaEntries,
  canJoin,
  dayHeading,
  entryKindLabel,
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
import { itemAt } from "@test/fixtures/list-assertions";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import {
  demoDay,
  lessonSession,
  workshopSession,
} from "@test/fixtures/program-calendar";
import { mobileTexts } from "@test/mobile-texts";

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
    kind: ProgramCalendarEntryKind.Event,
    startsAt: new Date(2026, 8, 23, 16, 0).toISOString(),
    endsAt: new Date(2026, 8, 23, 17, 30).toISOString(),
    description: "Teknokent B-104",
    plan: null,
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
  kind: ProgramCalendarEntryKind.Deadline,
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
  mobileTexts(),
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

describe("agendaEntries for the weekly plan", () => {
  it("shows a session as Program oturumu, all day, with its speaker and week in the sheet", () => {
    const [entry] = agendaEntries([], [lessonSession()], mobileTexts());

    expect(entry).toMatchObject({
      kind: MobileAgendaKind.Session,
      time: "Tüm gün",
      length: "",
      title: "Değer Önerisi ve Market Fit",
      detail: "Program oturumu · Konuşmacı: Sarper",
      notes: "Konuşmacı: Sarper\n4. hafta · Sorunu Doğrula",
    });
  });

  it("shows a special day as an event at its time with its place and details", () => {
    const [entry] = agendaEntries([], [demoDay()], mobileTexts());

    expect(entry).toMatchObject({
      kind: MobileAgendaKind.Event,
      time: "13:00",
      detail: "Özel gün · Yer: KKM",
      notes: "Yer: KKM\nProgram final etkinliği.",
    });
  });

  it("keeps an all-day session open for its whole day and names its kind in the sheet", () => {
    const entry = itemAt(
      agendaEntries([], [lessonSession()], mobileTexts()),
      0,
    );

    expect(entry.endsAt).toEqual(new Date(2026, 10, 17));
    expect(entryTimeLine(entry, mobileTexts())).toBe(
      "Pazartesi 16 Kasım · Tüm gün",
    );
    expect(entryKindLabel(entry, mobileTexts())).toBe("Program oturumu");
    const demo = itemAt(agendaEntries([], [demoDay()], mobileTexts()), 0);
    expect(entryKindLabel(demo, mobileTexts())).toBe("Özel gün");
    expect(entryKindLabel(itemAt(ENTRIES, 1), mobileTexts())).toBe(
      "Mentorluk görüşmesi",
    );
  });

  it("names a session in English", () => {
    const [entry] = agendaEntries([], [workshopSession()], mobileTexts("en"));

    expect(entry?.time).toBe("All day");
    expect(entry?.detail).toBe("Program session · Week 4 · Sorunu Doğrula");
  });
});

describe("weekStrip", () => {
  it("lays out Monday to Sunday with today selected and each day's kinds", () => {
    const strip = weekStrip(new Date(2026, 8, 23), ENTRIES, NOW, "tr");

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
    expect(
      weekStrip(new Date(2026, 8, 23), ENTRIES, NOW, "en").map(
        (day) => day.weekday,
      ),
    ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });
});

describe("agendaDays and dayHeading", () => {
  it("lists the selected day and the rest of its week that have entries", () => {
    const days = agendaDays(new Date(2026, 8, 23), ENTRIES, NOW, mobileTexts());

    expect(days.map((day) => day.heading)).toEqual([
      "Bugün · Çarşamba 23 Eylül",
      "Yarın · Perşembe 24 Eylül",
      "Cuma 25 Eylül",
    ]);
    expect(
      agendaDays(new Date(2026, 8, 23), ENTRIES, NOW, mobileTexts("en")).map(
        (day) => day.heading,
      ),
    ).toEqual([
      "Today · Wednesday, September 23",
      "Tomorrow · Thursday, September 24",
      "Friday, September 25",
    ]);
  });

  it("starts from a later selected day", () => {
    expect(
      agendaDays(new Date(2026, 8, 25), ENTRIES, NOW, mobileTexts()).map(
        (day) => day.heading,
      ),
    ).toEqual(["Cuma 25 Eylül"]);
    expect(dayHeading(new Date(2026, 8, 30), NOW, mobileTexts())).toBe(
      "Çarşamba 30 Eylül",
    );
  });
});

describe("next entry", () => {
  it("picks the first unfinished entry and says how soon it starts", () => {
    const next = nextEntry(ENTRIES, NOW);

    expect(next?.title).toBe("Ürün-Pazar Uyumu Atölyesi");
    const { t } = mobileTexts();
    expect(nextEntryLabel(next!, NOW, t)).toBe("Sıradaki · 2 saat sonra");
    expect(nextEntryLabel(next!, new Date(2026, 8, 23, 15, 45), t)).toBe(
      "Sıradaki · 15 dk sonra",
    );
    expect(nextEntryLabel(ENTRIES[1]!, NOW, t)).toBe("Sıradaki · yarın");

    const en = mobileTexts("en").t;
    expect(nextEntryLabel(next!, NOW, en)).toBe("Next · in 2 hours");
    expect(nextEntryLabel(ENTRIES[1]!, NOW, en)).toBe("Next · tomorrow");
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
      mobileTexts(),
    );

    expect(canJoin(entry!, NOW)).toBe(false);
  });
});

describe("detail texts", () => {
  it("describes the time and the link", () => {
    const meeting = ENTRIES[1]!;

    expect(entryTimeLine(meeting, mobileTexts())).toBe(
      "Perşembe 24 Eylül · 14:00–15:00",
    );
    expect(entryTimeHint(meeting, NOW, mobileTexts().t)).toBe("60 dk · yarın");
    expect(entryTimeLine(meeting, mobileTexts("en"))).toBe(
      "Thursday, September 24 · 02:00 PM–03:00 PM",
    );
    expect(
      meetingLinkLabel("https://meet.google.com/abc", mobileTexts().t),
    ).toBe("Google Meet");
    expect(meetingLinkLabel("https://zoom.us/j/1", mobileTexts().t)).toBe(
      "zoom.us",
    );
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
