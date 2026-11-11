import { describe, expect, it } from "vitest";

import { Weekday } from "@/interfaces/mentor";
import {
  availabilitySummary,
  hasAvailability,
  isDayOff,
  weekAvailability,
} from "@/lib/academician-availability";
import { AvailabilityItemKind } from "@/types/academician-office-hours";
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
