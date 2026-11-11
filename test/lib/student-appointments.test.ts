import { describe, expect, it } from "vitest";

import { AppointmentStatus } from "@/interfaces/appointment";
import {
  APPOINTMENT_GRID_HOURS,
  appointmentsOnDay,
  appointmentTabs,
  calendarTitle,
  gridPlacement,
  shiftAnchor,
  shortPersonName,
  visibleDays,
} from "@/lib/student-appointments";
import {
  AppointmentsTab,
  AppointmentsView,
} from "@/types/student-appointments";
import {
  APPOINTMENTS_NOW,
  peerAppointment,
  STUDENT_APPOINTMENTS,
} from "@test/fixtures/student-appointments";

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute).toISOString();

describe("appointmentTabs", () => {
  it("splits confirmed sessions ahead, requests ahead and the rest", () => {
    const request = peerAppointment({
      id: "request",
      status: AppointmentStatus.AlternativeProposed,
      startsAt: "2026-11-14T08:00:00.000Z",
      endsAt: "2026-11-14T08:30:00.000Z",
    });
    const tabs = appointmentTabs(
      [...STUDENT_APPOINTMENTS, request],
      APPOINTMENTS_NOW,
    );
    expect(tabs[AppointmentsTab.Upcoming].map((item) => item.id)).toEqual([
      "meeting-2",
      "meeting-1",
    ]);
    expect(tabs[AppointmentsTab.Requests].map((item) => item.id)).toEqual([
      "request",
    ]);
    expect(tabs[AppointmentsTab.Past].map((item) => item.id)).toEqual([
      "meeting-4",
      "meeting-3",
    ]);
  });
});

describe("appointmentsOnDay", () => {
  it("keeps one day's sessions, earliest first", () => {
    const late = peerAppointment({
      id: "late",
      startsAt: at(12, 16),
      endsAt: at(12, 17),
    });
    const early = peerAppointment({
      id: "early",
      startsAt: at(12, 9),
      endsAt: at(12, 10),
    });
    const other = peerAppointment({
      id: "other",
      startsAt: at(13, 9),
      endsAt: at(13, 10),
    });
    expect(
      appointmentsOnDay([late, other, early], new Date(2026, 10, 12)).map(
        (item) => item.id,
      ),
    ).toEqual(["early", "late"]);
  });
});

describe("gridPlacement", () => {
  it("places a session by its hours from the first row", () => {
    expect(
      gridPlacement(
        peerAppointment({ startsAt: at(12, 10, 30), endsAt: at(12, 11, 30) }),
      ),
    ).toEqual({ top: 1.5, height: 1 });
  });

  it("gives a short session half an hour so it stays clickable", () => {
    expect(
      gridPlacement(
        peerAppointment({ startsAt: at(12, 10), endsAt: at(12, 10, 10) }),
      ),
    ).toEqual({ top: 1, height: 0.5 });
  });

  it("pins sessions outside the grid's hours to its first or last row", () => {
    expect(
      gridPlacement(
        peerAppointment({ startsAt: at(12, 7), endsAt: at(12, 8) }),
      ),
    ).toEqual({ top: 0, height: 0.5 });
    const late = gridPlacement(
      peerAppointment({ startsAt: at(12, 20), endsAt: at(12, 21) }),
    );
    expect(late).toEqual({
      top: APPOINTMENT_GRID_HOURS.length - 0.5,
      height: 0.5,
    });
  });
});

describe("visibleDays", () => {
  const anchor = new Date(2026, 10, 12, 15);

  it("shows the anchor day alone, or its whole week from Monday", () => {
    expect(visibleDays(AppointmentsView.Day, anchor)).toEqual([
      new Date(2026, 10, 12),
    ]);
    const week = visibleDays(AppointmentsView.Week, anchor);
    expect(week).toHaveLength(7);
    expect(week[0]).toEqual(new Date(2026, 10, 9));
  });

  it("puts nothing on the time grid for the list and month views", () => {
    expect(visibleDays(AppointmentsView.List, anchor)).toEqual([]);
    expect(visibleDays(AppointmentsView.Month, anchor)).toEqual([]);
  });
});

describe("shiftAnchor", () => {
  const anchor = new Date(2026, 10, 30, 15);

  it("steps a day, a week or a month", () => {
    expect(shiftAnchor(AppointmentsView.Day, anchor, 1)).toEqual(
      new Date(2026, 11, 1),
    );
    expect(shiftAnchor(AppointmentsView.Week, anchor, -1)).toEqual(
      new Date(2026, 10, 23),
    );
    expect(shiftAnchor(AppointmentsView.Month, anchor, 1)).toEqual(
      new Date(2026, 11, 1),
    );
    expect(shiftAnchor(AppointmentsView.List, anchor, 1)).toEqual(
      new Date(2026, 10, 30),
    );
  });
});

describe("calendarTitle", () => {
  const anchor = new Date(2026, 10, 13);

  it("names the day, the week or the month", () => {
    expect(calendarTitle(AppointmentsView.Day, anchor, "tr")).toBe(
      "13 Kasım 2026 Cuma",
    );
    expect(calendarTitle(AppointmentsView.Week, anchor, "tr")).toBe(
      "9 – 15 Kasım 2026",
    );
    expect(calendarTitle(AppointmentsView.Month, anchor, "tr")).toBe(
      "Kasım 2026",
    );
  });
});

describe("shortPersonName", () => {
  it("shortens the first name to an initial", () => {
    expect(shortPersonName("Elif Karaca")).toBe("E. Karaca");
    expect(shortPersonName("Ayşe Nur Yılmaz")).toBe("A. Yılmaz");
    expect(shortPersonName("Cher")).toBe("Cher");
  });
});
