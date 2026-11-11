import { describe, expect, it } from "vitest";

import { Weekday } from "@/interfaces/mentor";
import {
  availabilitySummary,
  dayOffError,
  hasAvailability,
  isDayOff,
  oneOffError,
  ruleError,
  toAvailabilityPayload,
  weekAvailability,
  withDayOff,
  withOneOff,
  withoutDayOff,
  withoutOneOff,
  withoutRule,
  withRule,
} from "@/lib/academician-availability";
import {
  AvailabilityFormError,
  AvailabilityItemKind,
} from "@/types/academician-office-hours";
import {
  academicianAvailability,
  halfHour,
} from "@test/fixtures/academician-office-hours";

// Tuesday 10 November 2026, 10:00 in Istanbul.
const NOW = new Date("2026-11-10T07:00:00Z");

const ONE_OFF_FRIDAY = {
  id: "one-off-friday",
  startsAt: "2026-11-13T10:00:00+03:00",
  endsAt: "2026-11-13T12:00:00+03:00",
  place: null,
};

const ONE_OFF_PAST = {
  id: "one-off-past",
  ...halfHour("2026-11-09T09:00"),
  place: null,
};

describe("isDayOff", () => {
  const exceptions = [
    { startsOn: "2026-11-18", endsOn: "2026-11-20", reason: null },
  ];

  it("counts both ends of a day-off range", () => {
    expect(isDayOff("2026-11-18", exceptions)).toBe(true);
    expect(isDayOff("2026-11-20", exceptions)).toBe(true);
    expect(isDayOff("2026-11-21", exceptions)).toBe(false);
  });
});

describe("hasAvailability", () => {
  it("is true with a weekly range", () => {
    expect(hasAvailability(academicianAvailability(), NOW)).toBe(true);
  });

  it("is false when the only hours are a one-off that is over", () => {
    expect(
      hasAvailability(
        academicianAvailability({ rules: [], oneOffs: [ONE_OFF_PAST] }),
        NOW,
      ),
    ).toBe(false);
  });

  it("is true with a one-off still ahead", () => {
    expect(
      hasAvailability(
        academicianAvailability({ rules: [], oneOffs: [ONE_OFF_FRIDAY] }),
        NOW,
      ),
    ).toBe(true);
  });
});

describe("availabilitySummary", () => {
  it("lists weekly ranges in week order, then upcoming one-offs and days off", () => {
    const summary = availabilitySummary(
      academicianAvailability({
        oneOffs: [ONE_OFF_FRIDAY, ONE_OFF_PAST],
        exceptions: [
          {
            id: "past",
            startsOn: "2026-11-02",
            endsOn: "2026-11-03",
            reason: null,
          },
          {
            id: "conference",
            startsOn: "2026-11-20",
            endsOn: "2026-11-20",
            reason: "Konferans",
          },
        ],
      }),
      NOW,
    );

    expect(summary.map((item) => item.kind)).toEqual([
      AvailabilityItemKind.Recurring,
      AvailabilityItemKind.Recurring,
      AvailabilityItemKind.OneOff,
      AvailabilityItemKind.Unavailable,
    ]);
    expect(summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: expect.objectContaining({ id: "rule-tuesday" }),
        }),
        expect.objectContaining({ oneOff: ONE_OFF_FRIDAY }),
        expect.objectContaining({
          exception: expect.objectContaining({ id: "conference" }),
        }),
      ]),
    );
    const [first] = summary;
    expect(first).toEqual({
      kind: AvailabilityItemKind.Recurring,
      rule: expect.objectContaining({ dayOfWeek: Weekday.Tuesday }),
    });
  });

  it("keeps a day off that has started but not ended", () => {
    const summary = availabilitySummary(
      academicianAvailability({
        rules: [],
        exceptions: [
          {
            id: "running",
            startsOn: "2026-11-09",
            endsOn: "2026-11-11",
            reason: null,
          },
        ],
      }),
      NOW,
    );
    expect(summary).toHaveLength(1);
  });
});

describe("weekAvailability", () => {
  it("adds up this week's weekly ranges and names their days", () => {
    expect(weekAvailability(academicianAvailability(), NOW)).toEqual({
      minutes: 240,
      weekdays: [Weekday.Tuesday, Weekday.Thursday],
    });
  });

  it("drops a day off and adds a one-off on another day", () => {
    expect(
      weekAvailability(
        academicianAvailability({
          exceptions: [
            { startsOn: "2026-11-12", endsOn: "2026-11-12", reason: null },
          ],
          oneOffs: [ONE_OFF_FRIDAY],
        }),
        NOW,
      ),
    ).toEqual({ minutes: 240, weekdays: [Weekday.Tuesday, Weekday.Friday] });
  });

  it("is empty without any hours", () => {
    expect(
      weekAvailability(academicianAvailability({ rules: [] }), NOW),
    ).toEqual({ minutes: 0, weekdays: [] });
  });
});

describe("availability edits", () => {
  const availability = academicianAvailability({
    exceptions: [
      {
        id: "conference",
        startsOn: "2026-11-20",
        endsOn: "2026-11-21",
        reason: "Konferans",
      },
    ],
    oneOffs: [ONE_OFF_FRIDAY],
  });

  it("sends everything without the ids the source hands out", () => {
    expect(toAvailabilityPayload(availability)).toEqual({
      rules: [
        {
          dayOfWeek: Weekday.Thursday,
          startTime: "14:00",
          endTime: "16:00",
          slotMinutes: 30,
        },
        {
          dayOfWeek: Weekday.Tuesday,
          startTime: "10:00",
          endTime: "12:00",
          slotMinutes: 30,
        },
      ],
      exceptions: availability.exceptions,
      menteeCapacity: null,
      defaultMeetingDurationMinutes: 30,
      meetingBufferMinutes: 0,
      oneOffs: [
        {
          startsAt: ONE_OFF_FRIDAY.startsAt,
          endsAt: ONE_OFF_FRIDAY.endsAt,
          place: null,
        },
      ],
    });
  });

  it("adds, replaces and removes a weekly range", () => {
    const monday = {
      dayOfWeek: Weekday.Monday,
      startTime: "09:00",
      endTime: "10:00",
    };
    expect(withRule(availability, monday, null).rules).toHaveLength(3);
    expect(withRule(availability, monday, "rule-tuesday").rules).toEqual([
      expect.objectContaining({ dayOfWeek: Weekday.Thursday }),
      { ...monday, slotMinutes: 30 },
    ]);
    expect(withoutRule(availability, "rule-thursday").rules).toEqual([
      expect.objectContaining({ dayOfWeek: Weekday.Tuesday }),
    ]);
  });

  it("adds one-off hours in Turkey time, place trimmed, and removes them", () => {
    expect(
      withOneOff(
        availability,
        {
          date: "2026-11-17",
          startTime: "15:00",
          endTime: "16:30",
          place: "  B-110 ",
        },
        null,
      ).oneOffs.at(-1),
    ).toEqual({
      startsAt: "2026-11-17T15:00:00+03:00",
      endsAt: "2026-11-17T16:30:00+03:00",
      place: "B-110",
    });
    expect(withoutOneOff(availability, "one-off-friday").oneOffs).toEqual([]);
  });

  it("adds a one-day day off, edits one keeping its id, and removes it", () => {
    expect(
      withDayOff(
        availability,
        { startsOn: "2026-11-25", endsOn: "", reason: " " },
        null,
      ).exceptions.at(-1),
    ).toEqual({ startsOn: "2026-11-25", endsOn: "2026-11-25", reason: null });
    expect(
      withDayOff(
        availability,
        { startsOn: "2026-11-20", endsOn: "2026-11-22", reason: "Kongre" },
        "conference",
      ).exceptions,
    ).toEqual([
      {
        id: "conference",
        startsOn: "2026-11-20",
        endsOn: "2026-11-22",
        reason: "Kongre",
      },
    ]);
    expect(withoutDayOff(availability, "conference").exceptions).toEqual([]);
  });
});

describe("availability validation", () => {
  const availability = academicianAvailability({
    exceptions: [
      { id: "off", startsOn: "2026-11-18", endsOn: "2026-11-18", reason: null },
    ],
    oneOffs: [ONE_OFF_FRIDAY],
  });

  it("checks a weekly range for times, order and a clash on the same day", () => {
    const tuesday = (startTime: string, endTime: string) => ({
      dayOfWeek: Weekday.Tuesday,
      startTime,
      endTime,
    });
    expect(ruleError(tuesday("", "12:00"), availability.rules, null)).toBe(
      AvailabilityFormError.NeedFields,
    );
    expect(ruleError(tuesday("12:00", "11:00"), availability.rules, null)).toBe(
      AvailabilityFormError.EndAfterStart,
    );
    expect(ruleError(tuesday("11:00", "13:00"), availability.rules, null)).toBe(
      AvailabilityFormError.Overlap,
    );
    expect(
      ruleError(tuesday("11:00", "13:00"), availability.rules, "rule-tuesday"),
    ).toBeNull();
    expect(
      ruleError(tuesday("12:00", "13:00"), availability.rules, null),
    ).toBeNull();
  });

  it("checks one-off hours for the past, a day off and a clash", () => {
    const oneOff = (date: string, startTime: string, endTime: string) => ({
      date,
      startTime,
      endTime,
      place: "",
    });
    expect(
      oneOffError(oneOff("", "10:00", "11:00"), availability, null, NOW),
    ).toBe(AvailabilityFormError.NeedFields);
    expect(
      oneOffError(
        oneOff("2026-11-17", "11:00", "10:00"),
        availability,
        null,
        NOW,
      ),
    ).toBe(AvailabilityFormError.EndAfterStart);
    expect(
      oneOffError(
        oneOff("2026-11-10", "09:00", "09:30"),
        availability,
        null,
        NOW,
      ),
    ).toBe(AvailabilityFormError.Past);
    expect(
      oneOffError(
        oneOff("2026-11-18", "10:00", "11:00"),
        availability,
        null,
        NOW,
      ),
    ).toBe(AvailabilityFormError.InsideDayOff);
    expect(
      oneOffError(
        oneOff("2026-11-13", "11:30", "12:30"),
        availability,
        null,
        NOW,
      ),
    ).toBe(AvailabilityFormError.Overlap);
    expect(
      oneOffError(
        oneOff("2026-11-13", "11:30", "12:30"),
        availability,
        "one-off-friday",
        NOW,
      ),
    ).toBeNull();
  });

  it("checks a day off for a start, the order and the same days again", () => {
    const { exceptions } = availability;
    expect(
      dayOffError({ startsOn: "", endsOn: "", reason: "" }, exceptions, null),
    ).toBe(AvailabilityFormError.NeedFields);
    expect(
      dayOffError(
        { startsOn: "2026-11-20", endsOn: "2026-11-19", reason: "" },
        exceptions,
        null,
      ),
    ).toBe(AvailabilityFormError.EndAfterStart);
    expect(
      dayOffError(
        { startsOn: "2026-11-17", endsOn: "2026-11-18", reason: "" },
        exceptions,
        null,
      ),
    ).toBe(AvailabilityFormError.Overlap);
    expect(
      dayOffError(
        { startsOn: "2026-11-18", endsOn: "", reason: "" },
        exceptions,
        "off",
      ),
    ).toBeNull();
  });
});
