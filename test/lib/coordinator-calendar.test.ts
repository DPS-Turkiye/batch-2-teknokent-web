import { describe, expect, it } from "vitest";

import { CoordinatorAgendaKind } from "@/interfaces/coordinator-overview";
import { ProgramEventKind } from "@/interfaces/coordinator-program";
import {
  CalendarView,
  conflictSummary,
  emptyEventDraft,
  eventDraftError,
  eventInput,
  isoDay,
  mentorshipHref,
  placeDayItems,
  rangeLabel,
  shiftAnchor,
  slotLabel,
  startOfWeek,
  viewDays,
  viewRange,
} from "@/lib/coordinator-calendar";
import {
  at,
  calendarMeeting,
  coordinatorCalendar,
} from "@test/fixtures/coordinator-calendar";

const WEDNESDAY = new Date(2026, 8, 16, 15, 0);

describe("coordinator calendar", () => {
  it("covers a Monday-to-Sunday week", () => {
    expect(isoDay(startOfWeek(WEDNESDAY))).toBe("2026-09-14");
    expect(isoDay(startOfWeek(new Date(2026, 8, 20)))).toBe("2026-09-14");
    expect(viewRange(CalendarView.Week, WEDNESDAY)).toEqual({
      from: "2026-09-14",
      to: "2026-09-20",
    });
    expect(rangeLabel(CalendarView.Week, WEDNESDAY)).toBe("14 – 20 Eylül 2026");
    expect(rangeLabel(CalendarView.Week, new Date(2026, 8, 30))).toBe(
      "28 Eylül – 4 Ekim 2026",
    );
  });

  it("covers whole weeks around a month and steps by month", () => {
    const days = viewDays(CalendarView.Month, WEDNESDAY);
    expect(isoDay(days[0])).toBe("2026-08-31");
    expect(isoDay(days[days.length - 1])).toBe("2026-10-04");
    expect(days.length % 7).toBe(0);
    expect(rangeLabel(CalendarView.Month, WEDNESDAY)).toBe("Eylül 2026");
    expect(isoDay(shiftAnchor(CalendarView.Month, WEDNESDAY, 1))).toBe(
      "2026-10-01",
    );
    expect(isoDay(shiftAnchor(CalendarView.Week, WEDNESDAY, -1))).toBe(
      "2026-09-09",
    );
  });

  it("places items on the 09–19 grid and shifts overlapping ones", () => {
    const placed = placeDayItems([
      calendarMeeting({
        id: "late",
        startsAt: at(2, 11, 30),
        endsAt: at(2, 12, 30),
      }),
      calendarMeeting({ id: "early", startsAt: at(2, 11), endsAt: at(2, 12) }),
      calendarMeeting({
        id: "deadline",
        kind: CoordinatorAgendaKind.Deadline,
        startsAt: at(2, 23, 59),
        endsAt: null,
      }),
    ]);
    expect(
      placed.map((entry) => [entry.item.id, entry.top, entry.lane]),
    ).toEqual([
      ["early", 2, 0],
      ["late", 2.5, 1],
      ["deadline", 9.25, 0],
    ]);
    expect(placed[2].height).toBe(0.75);
  });

  it("labels slots and conflicts", () => {
    expect(slotLabel(calendarMeeting())).toBe("Çar 16 Eyl · 14:00–15:00");
    expect(
      slotLabel(
        calendarMeeting({
          kind: CoordinatorAgendaKind.Deadline,
          startsAt: at(3, 23, 59),
          endsAt: null,
        }),
      ),
    ).toBe("Per 17 Eyl · 23:59");
    const calendar = coordinatorCalendar();
    expect(conflictSummary(calendar.conflicts[0], calendar.items)).toEqual({
      heading: "2 çakışma",
      who: "Ahmet Can · Çar",
      body: "Nova Robotics (11:00) ve Vega (11:30) görüşmeleri üst üste bindi.",
    });
    expect(mentorshipHref("mentorship-1")).toBe(
      "/coordinator/mentorships?mentorship=mentorship-1",
    );
  });

  it("validates and converts the add-event draft", () => {
    const draft = emptyEventDraft("program-1", WEDNESDAY);
    expect(draft.day).toBe("2026-09-16");
    expect(eventDraftError(draft)).toBe("Başlık girin.");
    expect(eventDraftError({ ...draft, programId: "" })).toBe(
      "Bir program seçin.",
    );
    const titled = { ...draft, title: " Demo Day " };
    expect(
      eventDraftError({ ...titled, startTime: "12:00", endTime: "11:00" }),
    ).toBe("Bitiş saati başlangıçtan sonra olmalı.");
    expect(eventDraftError(titled)).toBeNull();
    expect(
      eventInput({
        ...titled,
        kind: ProgramEventKind.Deadline,
        description: "  ",
      }),
    ).toEqual({
      title: "Demo Day",
      kind: ProgramEventKind.Deadline,
      startsAt: new Date(2026, 8, 16, 10, 0).toISOString(),
      endsAt: null,
      description: null,
    });
  });
});
