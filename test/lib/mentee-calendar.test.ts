import { describe, expect, it } from "vitest";

import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { CalendarFilter } from "@/lib/calendar";
import {
  allDayProgramEvents,
  CalendarEntryKind,
  DAY_HEADER_HEIGHT,
  deliverableEntries,
  entryWhenLabel,
  eventBox,
  filterEntries,
  HOUR_ROW_HEIGHT,
  layoutDay,
  meetingEntries,
  prepHeading,
  PrepStatus,
  prepStatus,
  programEntries,
  upcomingEntries,
  weekSummary,
  type CalendarTexts,
} from "@/lib/mentee-calendar";
import { expectLength, itemAt } from "@test/fixtures/list-assertions";
import {
  lessonSession,
  memberProgramEvent,
  workshopSession,
} from "@test/fixtures/program-calendar";
import { translatorIn } from "@test/translators";

function calendarTexts(locale: "tr" | "en"): CalendarTexts {
  return {
    t: translatorIn(locale, "calendar"),
    locale,
  };
}
const texts = calendarTexts("tr");
const program = translatorIn("tr", "programCalendar");

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "m-1",
    organizationId: "org-1",
    mentorName: "Nihan Öztürk",
    agenda: "Ürün konumlandırma kararları",
    scheduledAt: new Date(2026, 7, 28, 14, 0).toISOString(),
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
}

const deliverable = {
  id: "ai-1",
  title: "Customer Interview Summary",
  dueDate: "2026-08-27",
  status: ActionItemStatus.Open,
};

describe("mentee calendar entries", () => {
  it("names a meeting by its mentor on the grid and by its agenda in lists", () => {
    const [entry] = meetingEntries(
      [
        meeting(),
        meeting({ id: "m-2", status: MeetingStatus.Cancelled }),
        meeting({ id: "m-3", noShowAt: "2026-09-10T12:00:00Z" }),
      ],
      texts,
    );

    expect(entry).toMatchObject({
      kind: CalendarEntryKind.Mentorship,
      gridLabel: "Nihan Öztürk",
      title: "Ürün konumlandırma kararları",
      detail: "Nihan Öztürk · mentorluk",
    });
    expect(
      meetingEntries([meeting({ status: MeetingStatus.Cancelled })], texts),
    ).toEqual([]);
  });

  it("puts open deliverables at the end of their due day, once each", () => {
    const entries = deliverableEntries(
      [
        deliverable,
        deliverable,
        { ...deliverable, id: "ai-2", status: ActionItemStatus.Completed },
        { ...deliverable, id: "ai-3", dueDate: null },
      ],
      texts,
    );

    expectLength(entries, 1);
    expect(entries[0].startsAt).toEqual(new Date(2026, 7, 27, 17, 0));
    expect(entries[0].gridLabel).toBe("Teslim");
  });

  it("filters by kind", () => {
    const entries = [
      ...meetingEntries([meeting()], texts),
      ...deliverableEntries([deliverable], texts),
    ];

    expect(filterEntries(entries, CalendarFilter.All)).toHaveLength(2);
    expect(
      filterEntries(entries, CalendarFilter.Deliverable).map((e) => e.kind),
    ).toEqual([CalendarEntryKind.Deliverable]);
    expect(filterEntries(entries, CalendarFilter.Program)).toEqual([]);
  });

  it("places an event by its start time and length, pinning out-of-hours ones to the edge", () => {
    const entry = itemAt(meetingEntries([meeting()], texts), 0);

    expect(eventBox(entry)).toEqual({
      top: DAY_HEADER_HEIGHT + 5 * HOUR_ROW_HEIGHT,
      height: 0.75 * HOUR_ROW_HEIGHT,
    });
    const early = itemAt(
      meetingEntries(
        [meeting({ scheduledAt: new Date(2026, 7, 28, 7, 30).toISOString() })],
        texts,
      ),
      0,
    );
    const late = itemAt(
      meetingEntries(
        [meeting({ scheduledAt: new Date(2026, 7, 28, 20, 0).toISOString() })],
        texts,
      ),
      0,
    );
    expect(eventBox(early).top).toBe(DAY_HEADER_HEIGHT);
    const gridBottom = DAY_HEADER_HEIGHT + 10 * HOUR_ROW_HEIGHT;
    expect(eventBox(late).top + eventBox(late).height).toBeLessThanOrEqual(
      gridBottom,
    );
  });

  it("splits the column between overlapping entries only", () => {
    const entries = meetingEntries(
      [
        meeting({
          id: "a",
          scheduledAt: new Date(2026, 7, 28, 14, 0).toISOString(),
        }),
        meeting({
          id: "b",
          scheduledAt: new Date(2026, 7, 28, 14, 30).toISOString(),
          durationMinutes: 60,
        }),
        meeting({
          id: "c",
          scheduledAt: new Date(2026, 7, 28, 16, 0).toISOString(),
        }),
      ],
      texts,
    );

    const laid = layoutDay(entries).map(({ entry, lane, lanes }) => [
      entry.id,
      lane,
      lanes,
    ]);

    expect(laid).toEqual([
      ["meeting:a", 0, 2],
      ["meeting:b", 1, 2],
      ["meeting:c", 0, 1],
    ]);
  });

  it("summarises the week and leaves program events out until there are some", () => {
    const entries = [
      ...meetingEntries([meeting()], texts),
      ...deliverableEntries([deliverable], texts),
    ];

    expect(weekSummary(entries, texts)).toBe(
      "Bu hafta 1 mentorluk görüşmesi · 1 teslim",
    );
  });

  it("turns program entries into grid entries labelled by kind, opening on the entry", () => {
    const lesson = lessonSession();
    const [session, event] = programEntries(
      [lesson, memberProgramEvent()],
      program,
    );

    expect(session).toEqual({
      id: "program:session-lesson",
      kind: CalendarEntryKind.Program,
      gridLabel: "Program oturumu",
      title: "Değer Önerisi ve Market Fit",
      detail: "Konuşmacı: Sarper",
      startsAt: new Date(2026, 10, 16),
      durationMinutes: 0,
      allDay: true,
      meeting: null,
      programEvent: lesson,
    });
    expect(event?.gridLabel).toBe("Program etkinliği");
    expect(event?.durationMinutes).toBe(90);
    expect(event?.detail).toBe("Build");
    expect(event?.allDay).toBe(false);
  });

  it("counts program entries in the summary and dates an all-day one by its day alone", () => {
    const entries = [
      ...meetingEntries([meeting()], texts),
      ...programEntries([lessonSession(), workshopSession()], program),
    ];

    expect(weekSummary(entries, texts)).toBe(
      "Bu hafta 1 mentorluk görüşmesi · 2 program etkinliği · 0 teslim",
    );
    expect(
      entryWhenLabel(
        itemAt(programEntries([lessonSession()], program), 0),
        "tr",
      ),
    ).toBe("Pzt 16");
    expect(
      entryWhenLabel(
        itemAt(programEntries([memberProgramEvent()], program), 0),
        "tr",
      ),
    ).toBe("Çar 18 · 16:00");
  });

  it("keeps an all-day program entry ahead until its day is over and sets it apart from the hour grid", () => {
    const entries = programEntries(
      [lessonSession(), memberProgramEvent()],
      program,
    );
    const lessonDayNoon = new Date(2026, 10, 16, 12, 0);

    expect(
      upcomingEntries(entries, lessonDayNoon, 3).map((entry) => entry.id),
    ).toEqual(["program:session-lesson", "program:event-1"]);
    expect(
      upcomingEntries(entries, new Date(2026, 10, 17, 0, 0), 3).map(
        (entry) => entry.id,
      ),
    ).toEqual(["program:event-1"]);
    expect(allDayProgramEvents(entries).map((event) => event.id)).toEqual([
      "session-lesson",
    ]);
  });

  it("lists what is still ahead, soonest first", () => {
    const entries = [
      ...meetingEntries([meeting()], texts),
      ...deliverableEntries([deliverable], texts),
    ];
    const now = new Date(2026, 7, 26, 9, 0);

    expect(
      upcomingEntries(entries, now, 3).map((entry) =>
        entryWhenLabel(entry, "tr"),
      ),
    ).toEqual(["Per 27", "Cum 28 · 14:00"]);
    expect(upcomingEntries(entries, new Date(2026, 7, 29), 3)).toEqual([]);
  });

  it("marks preparation overdue only once its due day has passed", () => {
    const now = new Date(2026, 7, 27, 18, 0);

    expect(prepStatus({ ...deliverable, dueDate: "2026-08-26" }, now)).toBe(
      PrepStatus.Overdue,
    );
    expect(prepStatus(deliverable, now)).toBe(PrepStatus.InProgress);
    expect(prepStatus({ ...deliverable, dueDate: null }, now)).toBe(
      PrepStatus.InProgress,
    );
  });

  it("describes the meeting a preparation is for", () => {
    expect(prepHeading(meeting(), texts)).toBe(
      "28 Ağustos Cuma · Nihan Öztürk görüşmesi",
    );
  });

  it("writes the labels in English", () => {
    const english = calendarTexts("en");
    const entries = [
      ...meetingEntries([meeting()], english),
      ...deliverableEntries([deliverable], english),
    ];

    expect(weekSummary(entries, english)).toBe(
      "This week: 1 mentoring session · 1 deliverable",
    );
    expect(entries[0]?.detail).toBe("Nihan Öztürk · mentoring");
    expect(prepHeading(meeting(), english)).toBe(
      "Friday, August 28 · Meeting with Nihan Öztürk",
    );
    expect(entryWhenLabel(itemAt(entries, 0), "en")).toBe("Fri 28 · 02:00 PM");
  });
});
