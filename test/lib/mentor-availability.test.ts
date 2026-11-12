import { describe, expect, it } from "vitest";

import { Weekday } from "@/interfaces/mentor";
import {
  availabilityDraftError,
  exceptionError,
  exceptionLabel,
  exceptionsInRange,
  nextRangeAfter,
  stepNumberValue,
  toAvailabilityDraft,
  toAvailabilityPayload,
  weekdayOf,
  type AvailabilityDraft,
  type AvailabilityRange,
} from "@/lib/mentor-availability";

/** Tuesday 10:00–13:00 in hour-long slots, the draft's one range unless told otherwise. */
function tuesdayRange(
  overrides: Partial<AvailabilityRange> = {},
): AvailabilityRange {
  return {
    key: "rule-1",
    dayOfWeek: Weekday.Tuesday,
    startTime: "10:00",
    endTime: "13:00",
    slotMinutes: 60,
    ...overrides,
  };
}

function draft(overrides: Partial<AvailabilityDraft> = {}): AvailabilityDraft {
  return {
    ranges: [tuesdayRange()],
    exceptions: [],
    menteeCapacity: "",
    defaultMeetingDurationMinutes: "45",
    meetingBufferMinutes: "15",
    ...overrides,
  };
}

describe("toAvailabilityDraft", () => {
  it("drops the seconds and leaves an unset capacity empty", () => {
    expect(
      toAvailabilityDraft({
        rules: [
          {
            id: "rule-1",
            dayOfWeek: Weekday.Tuesday,
            startTime: "10:00:00",
            endTime: "13:00:00",
            slotMinutes: 60,
          },
        ],
        exceptions: [
          {
            id: "x",
            startsOn: "2026-10-01",
            endsOn: "2026-10-01",
            reason: null,
          },
        ],
        menteeCapacity: null,
        defaultMeetingDurationMinutes: 45,
        meetingBufferMinutes: 15,
      }),
    ).toEqual(
      draft({
        exceptions: [
          { startsOn: "2026-10-01", endsOn: "2026-10-01", reason: null },
        ],
      }),
    );
  });
});

describe("availabilityDraftError", () => {
  it("accepts back-to-back ranges on one day and the same range on another day", () => {
    expect(
      availabilityDraftError(
        draft({
          ranges: [
            ...draft().ranges,
            {
              key: "b",
              dayOfWeek: Weekday.Tuesday,
              startTime: "13:00",
              endTime: "15:00",
              slotMinutes: null,
            },
            {
              key: "c",
              dayOfWeek: Weekday.Friday,
              startTime: "10:00",
              endTime: "13:00",
              slotMinutes: null,
            },
          ],
        }),
      ),
    ).toBeNull();
  });

  it("names the day whose ranges overlap or run backwards", () => {
    const overlapping = draft({
      ranges: [
        ...draft().ranges,
        {
          key: "b",
          dayOfWeek: Weekday.Tuesday,
          startTime: "12:00",
          endTime: "14:00",
          slotMinutes: null,
        },
      ],
    });
    const backwards = draft({
      ranges: [tuesdayRange({ startTime: "13:00", endTime: "10:00" })],
    });

    expect(availabilityDraftError(overlapping)).toBe(
      "Salı: saat aralıkları çakışıyor.",
    );
    expect(availabilityDraftError(backwards)).toBe(
      "Salı: bitiş saati başlangıçtan sonra olmalı.",
    );
  });

  it("refuses numbers the backend would refuse, but allows an empty capacity", () => {
    expect(availabilityDraftError(draft({ menteeCapacity: "0" }))).toBe(
      "Eş zamanlı mentorluk limiti 1 ile 50 arasında olmalı.",
    );
    expect(
      availabilityDraftError(draft({ defaultMeetingDurationMinutes: "" })),
    ).toBe("Varsayılan görüşme süresi 15 ile 480 dakika arasında olmalı.");
    expect(availabilityDraftError(draft({ meetingBufferMinutes: "-5" }))).toBe(
      "İki görüşme arası tampon 0 ile 240 dakika arasında olmalı.",
    );
    expect(availabilityDraftError(draft({ menteeCapacity: "" }))).toBeNull();
  });

  it("refuses to empty a capacity that is already saved", () => {
    expect(
      availabilityDraftError(draft({ menteeCapacity: "" }), {
        capacityRequired: true,
      }),
    ).toBe("Eş zamanlı mentorluk limiti 1 ile 50 arasında olmalı.");
    expect(
      availabilityDraftError(draft({ menteeCapacity: "4" }), {
        capacityRequired: true,
      }),
    ).toBeNull();
  });
});

describe("exceptionError", () => {
  const existing = [
    { startsOn: "2026-10-01", endsOn: "2026-10-03", reason: null },
  ];

  it("needs a start date that is not after the end", () => {
    expect(
      exceptionError({ startsOn: "", endsOn: "", reason: null }, existing),
    ).toBe("Bir başlangıç tarihi seç.");
    expect(
      exceptionError(
        { startsOn: "2026-10-05", endsOn: "2026-10-04", reason: null },
        existing,
      ),
    ).toBe("Bitiş tarihi başlangıçtan önce olamaz.");
  });

  it("refuses dates that are already on the list", () => {
    expect(
      exceptionError(
        { startsOn: "2026-10-01", endsOn: "2026-10-03", reason: "Tatil" },
        existing,
      ),
    ).toBe("Bu tarih aralığı zaten ekli.");
  });
});

describe("exceptionsInRange", () => {
  const monday = new Date(2026, 8, 21);
  const friday = new Date(2026, 8, 25);
  const leave = {
    startsOn: "2026-09-21",
    endsOn: "2026-09-25",
    reason: "İzin",
  };
  const overlapStart = {
    startsOn: "2026-09-18",
    endsOn: "2026-09-21",
    reason: null,
  };
  const overlapEnd = {
    startsOn: "2026-09-25",
    endsOn: "2026-09-28",
    reason: null,
  };
  const before = { startsOn: "2026-09-14", endsOn: "2026-09-18", reason: null };
  const after = { startsOn: "2026-09-26", endsOn: "2026-09-26", reason: null };

  it("keeps ranges that touch the week, including its first and last day", () => {
    expect(
      exceptionsInRange(
        [leave, overlapStart, overlapEnd, before, after],
        monday,
        friday,
      ),
    ).toEqual([leave, overlapStart, overlapEnd]);
  });
});

describe("exceptionLabel", () => {
  const now = new Date("2026-09-15T12:00:00");

  it("names the days in the page's language, writes a shared month once and adds the reason", () => {
    expect(
      exceptionLabel(
        { startsOn: "2026-10-03", endsOn: "2026-10-03", reason: "Konferans" },
        "tr",
        now,
      ),
    ).toBe("3 Ekim · Konferans");
    expect(
      exceptionLabel(
        { startsOn: "2026-09-21", endsOn: "2026-09-25", reason: "İzin" },
        "tr",
        now,
      ),
    ).toMatch(/^21\s–\s25 Eylül · İzin$/);
    expect(
      exceptionLabel(
        { startsOn: "2026-09-30", endsOn: "2026-10-02", reason: null },
        "tr",
        now,
      ),
    ).toMatch(/^30 Eylül\s–\s2 Ekim$/);
    expect(
      exceptionLabel(
        { startsOn: "2026-09-21", endsOn: "2026-09-25", reason: null },
        "en",
        now,
      ),
    ).toMatch(/^September 21\s–\s25$/);
  });

  it("adds the year only when it is not this year", () => {
    expect(
      exceptionLabel(
        { startsOn: "2027-01-04", endsOn: "2027-01-04", reason: null },
        "tr",
        now,
      ),
    ).toBe("4 Ocak 2027");
  });
});

describe("stepNumberValue", () => {
  const bounds = { min: 15, max: 480, step: 15 };

  it("moves by the field's step and stays within its bounds", () => {
    expect(stepNumberValue("45", bounds, 1)).toBe("60");
    expect(stepNumberValue("20", bounds, -1)).toBe("15");
    expect(stepNumberValue("475", bounds, 1)).toBe("480");
  });

  it("starts an empty field at its minimum", () => {
    expect(stepNumberValue("", bounds, 1)).toBe("15");
  });
});

describe("nextRangeAfter", () => {
  it("starts where the last range ends and stops before midnight", () => {
    expect(nextRangeAfter([])).toEqual({
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(nextRangeAfter(draft().ranges)).toEqual({
      startTime: "13:00",
      endTime: "14:00",
    });
    expect(nextRangeAfter([tuesdayRange({ endTime: "23:30" })])).toEqual({
      startTime: "23:30",
      endTime: "23:59",
    });
  });
});

describe("toAvailabilityPayload", () => {
  it("keeps saved slot lengths, gives new ranges the default and sends an empty capacity as null", () => {
    expect(
      toAvailabilityPayload(
        draft({
          ranges: [
            ...draft().ranges,
            {
              key: "new-1",
              dayOfWeek: Weekday.Friday,
              startTime: "09:00",
              endTime: "12:00",
              slotMinutes: null,
            },
          ],
        }),
      ),
    ).toEqual({
      rules: [
        {
          dayOfWeek: Weekday.Tuesday,
          startTime: "10:00",
          endTime: "13:00",
          slotMinutes: 60,
        },
        {
          dayOfWeek: Weekday.Friday,
          startTime: "09:00",
          endTime: "12:00",
          slotMinutes: 45,
        },
      ],
      exceptions: [],
      menteeCapacity: null,
      defaultMeetingDurationMinutes: 45,
      meetingBufferMinutes: 15,
    });
  });
});

describe("weekdayOf", () => {
  it("counts the week from Monday, with Sunday last", () => {
    expect(weekdayOf(new Date(2026, 10, 9))).toBe(Weekday.Monday);
    expect(weekdayOf(new Date(2026, 10, 15))).toBe(Weekday.Sunday);
  });
});
