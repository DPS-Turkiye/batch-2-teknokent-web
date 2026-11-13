import { describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import { Weekday } from "@/interfaces/mentor";
import {
  anchorDay,
  appointmentsHref,
  awaitingStudent,
  calendarDays,
  calendarEntries,
  calendarTitle,
  cancelNeedsReason,
  compactHours,
  dayColumns,
  DEFAULT_APPOINTMENTS_SEARCH,
  filterEntries,
  gridHours,
  monthCells,
  nowOffset,
  parseAppointmentsSearch,
  pendingRequests,
  requestFit,
  shiftAnchor,
  shortName,
  weekColumns,
  type CalendarSource,
} from "@/lib/academician-calendar";
import { isoDay } from "@/lib/coordinator-calendar";
import {
  AppointmentsCalendarView,
  AppointmentsFilter,
  CalendarEntryKind,
  RequestFit,
} from "@/types/academician-calendar";
import {
  academicianAppointment,
  academicianAvailability,
  academicianRequest,
  halfHour,
} from "@test/fixtures/academician-office-hours";
import { itemAt } from "@test/fixtures/list-assertions";

// Tuesday 10 November 2026, 10:00 in Istanbul.
const NOW = new Date("2026-11-10T07:00:00Z");
const BASE = "/academician/appointments";

function weekOf(day: Date) {
  return calendarDays(AppointmentsCalendarView.Week, day);
}

const SOURCE: CalendarSource = {
  requests: [
    academicianRequest({
      id: "berk",
      requestedTimes: [halfHour("2026-11-10T11:00")],
    }),
    academicianRequest({
      id: "ece",
      requestedTimes: [
        halfHour("2026-11-12T14:00"),
        halfHour("2026-11-09T09:00"),
      ],
    }),
    academicianRequest({
      id: "kaan",
      status: AppointmentStatus.AlternativeProposed,
      requestedTimes: [halfHour("2026-11-11T09:00")],
      proposedTimes: [halfHour("2026-11-13T10:30")],
      allowedActions: [],
    }),
    academicianRequest({
      id: "mert",
      awaitingStudentReply: true,
      requestedTimes: [halfHour("2026-11-11T15:00")],
    }),
  ],
  appointments: [
    academicianAppointment({ id: "ayse", ...halfHour("2026-11-10T10:00") }),
    academicianAppointment({
      id: "cancelled",
      status: AppointmentStatus.Cancelled,
      ...halfHour("2026-11-10T13:00"),
    }),
  ],
  availability: academicianAvailability({
    exceptions: [
      {
        id: "meeting",
        startsOn: "2026-11-11",
        endsOn: "2026-11-11",
        reason: "Bölüm toplantısı",
      },
    ],
    oneOffs: [
      {
        id: "friday",
        startsAt: "2026-11-13T10:00:00+03:00",
        endsAt: "2026-11-13T12:00:00+03:00",
        place: null,
      },
      {
        id: "on-day-off",
        startsAt: "2026-11-11T10:00:00+03:00",
        endsAt: "2026-11-11T11:00:00+03:00",
        place: null,
      },
    ],
  }),
};

describe("Randevularım URL state", () => {
  it("reads every known value and falls back on anything else", () => {
    expect(
      parseAppointmentsSearch({
        view: "month",
        date: "2026-11-17",
        filter: "requests",
        request: "berk",
        appointment: ["ayse", "other"],
      }),
    ).toEqual({
      view: AppointmentsCalendarView.Month,
      date: "2026-11-17",
      filter: AppointmentsFilter.Requests,
      request: "berk",
      appointment: "ayse",
    });
    expect(
      parseAppointmentsSearch({
        view: "year",
        date: "2026-02-30",
        filter: "",
        request: "",
      }),
    ).toEqual(DEFAULT_APPOINTMENTS_SEARCH);
  });

  it("writes only what differs from the defaults and reads it back", () => {
    expect(appointmentsHref(BASE, {})).toBe(BASE);
    const href = appointmentsHref(BASE, {
      view: AppointmentsCalendarView.Day,
      date: "2026-11-17",
      filter: AppointmentsFilter.Requests,
      request: "berk",
    });
    expect(href).toBe(
      `${BASE}?view=day&date=2026-11-17&filter=requests&request=berk`,
    );
    expect(
      parseAppointmentsSearch(
        Object.fromEntries(new URLSearchParams(href.slice(BASE.length))),
      ),
    ).toEqual({
      ...DEFAULT_APPOINTMENTS_SEARCH,
      view: AppointmentsCalendarView.Day,
      date: "2026-11-17",
      filter: AppointmentsFilter.Requests,
      request: "berk",
    });
  });

  it("anchors on the URL's day or on today", () => {
    expect(isoDay(anchorDay("2026-11-17", NOW))).toBe("2026-11-17");
    expect(isoDay(anchorDay(null, NOW))).toBe("2026-11-10");
  });
});

describe("calendarEntries", () => {
  const entries = calendarEntries(SOURCE, weekOf(NOW));
  const keysOf = (kind: CalendarEntryKind) =>
    entries.filter((entry) => entry.kind === kind).map((entry) => entry.key);

  it("expands weekly ranges per day and lets a day off close the day", () => {
    expect(keysOf(CalendarEntryKind.Recurring)).toEqual([
      "rule-tuesday@2026-11-10",
      "rule-thursday@2026-11-12",
    ]);
    expect(keysOf(CalendarEntryKind.Unavailable)).toEqual(["off@2026-11-11"]);
    expect(keysOf(CalendarEntryKind.OneOff)).toEqual(["friday@2026-11-13"]);
  });

  it("shows booked appointments only, and every open time of each request", () => {
    expect(keysOf(CalendarEntryKind.Confirmed)).toEqual(["ayse"]);
    expect(keysOf(CalendarEntryKind.PendingRequest)).toEqual([
      "berk@2026-11-10T11:00:00+03:00",
      "ece@2026-11-12T14:00:00+03:00",
      "ece@2026-11-09T09:00:00+03:00",
    ]);
    expect(keysOf(CalendarEntryKind.AwaitingStudent)).toEqual([
      "kaan@2026-11-13T10:30:00+03:00",
      "mert@2026-11-11T15:00:00+03:00",
    ]);
  });

  it("points the product tour at the earliest pending time only", () => {
    const anchors = entries.filter(
      (entry) =>
        entry.kind === CalendarEntryKind.PendingRequest && entry.tourAnchor,
    );
    expect(anchors.map((entry) => entry.key)).toEqual([
      "ece@2026-11-09T09:00:00+03:00",
    ]);
  });

  it("filters by the chips", () => {
    const kinds = (filter: AppointmentsFilter) =>
      new Set(filterEntries(entries, filter).map((entry) => entry.kind));
    expect(kinds(AppointmentsFilter.Appointments)).toEqual(
      new Set([CalendarEntryKind.Confirmed]),
    );
    expect(kinds(AppointmentsFilter.Requests)).toEqual(
      new Set([
        CalendarEntryKind.PendingRequest,
        CalendarEntryKind.AwaitingStudent,
      ]),
    );
    expect(kinds(AppointmentsFilter.Availability)).toEqual(
      new Set([
        CalendarEntryKind.Recurring,
        CalendarEntryKind.OneOff,
        CalendarEntryKind.Unavailable,
      ]),
    );
    expect(filterEntries(entries, AppointmentsFilter.All)).toHaveLength(
      entries.length,
    );
  });
});

describe("calendar grid", () => {
  it("is Monday to Friday unless the weekend has something on it", () => {
    const days = weekOf(NOW);
    expect(days).toHaveLength(7);
    expect(weekColumns(days, calendarEntries(SOURCE, days))).toHaveLength(5);
    const saturday = calendarEntries(
      {
        ...SOURCE,
        appointments: [
          academicianAppointment({ ...halfHour("2026-11-14T10:00") }),
        ],
      },
      days,
    );
    expect(weekColumns(days, saturday).map(isoDay)).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
  });

  it("covers 09–18 and widens to whole hours around early or late entries", () => {
    expect(gridHours([])).toEqual({ startHour: 9, hours: 9 });
    const early = calendarEntries(
      {
        ...SOURCE,
        appointments: [
          academicianAppointment({ ...halfHour("2026-11-10T07:30") }),
          academicianAppointment({
            id: "late",
            ...halfHour("2026-11-10T18:45"),
          }),
        ],
      },
      [NOW],
    );
    expect(gridHours(early)).toEqual({ startHour: 7, hours: 13 });
  });

  it("puts appointments and requests in lanes in front of the availability band", () => {
    const days = [anchorDay("2026-11-10", NOW)];
    const columns = dayColumns(
      days,
      calendarEntries(SOURCE, days),
      gridHours([]),
    );
    const tuesday = itemAt(columns, 0);
    expect(
      tuesday.foreground.map((placed) => [placed.item.key, placed.lane]),
    ).toEqual([
      ["ayse", 0],
      ["berk@2026-11-10T11:00:00+03:00", 0],
    ]);
    expect(itemAt(tuesday.background, 0)).toMatchObject({ top: 1, height: 2 });
    expect(tuesday.unavailable).toBeNull();
  });

  it("fills the month grid with the first chips and counts the rest", () => {
    const anchor = anchorDay("2026-11-01", NOW);
    const days = calendarDays(AppointmentsCalendarView.Month, anchor);
    const cells = monthCells(anchor, calendarEntries(SOURCE, days), 1);
    expect(cells).toHaveLength(42);
    const tuesday = cells.find((cell) => cell.key === "2026-11-10");
    expect(tuesday?.chips.map((chip) => chip.kind)).toEqual([
      CalendarEntryKind.Recurring,
    ]);
    expect(tuesday?.overflow).toBe(2);
    expect(
      cells.find((cell) => cell.key === "2026-11-11")?.unavailable,
    ).not.toBeNull();
    expect(itemAt(cells, 0).inMonth).toBe(false);
  });

  it("draws the now line only on today, inside the grid", () => {
    const grid = gridHours([]);
    expect(nowOffset(NOW, anchorDay("2026-11-10", NOW), grid)).toBe(1);
    expect(nowOffset(NOW, anchorDay("2026-11-11", NOW), grid)).toBeNull();
    expect(
      nowOffset(
        new Date("2026-11-10T04:00:00Z"),
        anchorDay("2026-11-10", NOW),
        grid,
      ),
    ).toBeNull();
  });

  it("steps a day, a week or a month, landing on the 1st", () => {
    const anchor = anchorDay("2026-01-31", NOW);
    expect(isoDay(shiftAnchor(AppointmentsCalendarView.Day, anchor, 1))).toBe(
      "2026-02-01",
    );
    expect(isoDay(shiftAnchor(AppointmentsCalendarView.Week, anchor, -1))).toBe(
      "2026-01-24",
    );
    expect(isoDay(shiftAnchor(AppointmentsCalendarView.Month, anchor, 1))).toBe(
      "2026-02-01",
    );
  });

  it("titles each view with plain spaces", () => {
    const tuesday = anchorDay("2026-11-17", NOW);
    expect(calendarTitle(AppointmentsCalendarView.Day, tuesday, [], "tr")).toBe(
      "17 Kasım 2026, Salı",
    );
    const columns = weekColumns(weekOf(tuesday), []);
    expect(
      calendarTitle(AppointmentsCalendarView.Week, tuesday, columns, "tr"),
    ).toBe("16–20 Kasım 2026");
    expect(
      calendarTitle(AppointmentsCalendarView.Month, tuesday, [], "tr"),
    ).toBe("Kasım 2026");
  });
});

describe("rail lists", () => {
  it("orders waiting requests by their first time and lists the student's turn apart", () => {
    expect(
      pendingRequests(SOURCE.requests).map((request) => request.id),
    ).toEqual(["berk", "ece"]);
    expect(
      awaitingStudent(SOURCE.requests).map((request) => request.id),
    ).toEqual(["kaan", "mert"]);
  });
});

describe("requestFit", () => {
  const fit = (local: string) => requestFit(halfHour(local), SOURCE, NOW);

  it("fits a weekly range and names its day", () => {
    expect(fit("2026-11-12T14:30")).toEqual({
      fit: RequestFit.Fits,
      weekday: Weekday.Thursday,
    });
    expect(fit("2026-11-13T11:00").fit).toBe(RequestFit.Fits);
  });

  it("flags a past time, a day off, a clash and a time outside the hours", () => {
    expect(fit("2026-11-10T09:00").fit).toBe(RequestFit.Past);
    expect(fit("2026-11-11T10:00").fit).toBe(RequestFit.DayOff);
    expect(
      requestFit(
        halfHour("2026-11-17T10:15"),
        {
          ...SOURCE,
          appointments: [
            academicianAppointment({ ...halfHour("2026-11-17T10:00") }),
          ],
        },
        NOW,
      ).fit,
    ).toBe(RequestFit.Clash);
    expect(fit("2026-11-12T16:00").fit).toBe(RequestFit.Outside);
  });

  it("counts the buffer as part of a booked appointment", () => {
    const withBuffer = {
      ...SOURCE,
      availability: { ...SOURCE.availability, meetingBufferMinutes: 15 },
      appointments: [
        academicianAppointment({ ...halfHour("2026-11-17T10:00") }),
      ],
    };
    expect(requestFit(halfHour("2026-11-17T10:40"), withBuffer, NOW).fit).toBe(
      RequestFit.Clash,
    );
    expect(requestFit(halfHour("2026-11-17T11:00"), withBuffer, NOW).fit).toBe(
      RequestFit.Fits,
    );
  });
});

describe("cancelNeedsReason", () => {
  it("asks for a reason within 24 hours of the start", () => {
    expect(
      cancelNeedsReason(
        academicianAppointment({ ...halfHour("2026-11-11T09:00") }),
        NOW,
      ),
    ).toBe(true);
    expect(
      cancelNeedsReason(
        academicianAppointment({ ...halfHour("2026-11-11T11:00") }),
        NOW,
      ),
    ).toBe(false);
  });
});

describe("shortName", () => {
  it("keeps the first name and the last name's initial", () => {
    expect(shortName("Ayşe Yılmaz")).toBe("Ayşe Y.");
    expect(shortName("Mehmet Ali  Kaya")).toBe("Mehmet K.");
    expect(shortName("Cem")).toBe("Cem");
  });
});

describe("compactHours", () => {
  it("drops the minutes on the hour", () => {
    expect(
      compactHours(new Date(2026, 10, 10, 14), new Date(2026, 10, 10, 16)),
    ).toBe("14–16");
    expect(
      compactHours(
        new Date(2026, 10, 10, 9, 30),
        new Date(2026, 10, 10, 11, 5),
      ),
    ).toBe("9:30–11:05");
  });
});
