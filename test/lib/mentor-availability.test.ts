import { describe, expect, it } from "vitest";

import { Weekday } from "@/interfaces/mentor";
import {
  type AvailabilityDraft,
  availabilityDraftError,
  exceptionError,
  exceptionLabel,
  nextRangeAfter,
  toAvailabilityDraft,
  toAvailabilityPayload,
} from "@/lib/mentor-availability";

function draft(overrides: Partial<AvailabilityDraft> = {}): AvailabilityDraft {
  return {
    ranges: [
      {
        key: "rule-1",
        dayOfWeek: Weekday.Tuesday,
        startTime: "10:00",
        endTime: "13:00",
        slotMinutes: 60,
      },
    ],
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
      ranges: [{ ...draft().ranges[0], startTime: "13:00", endTime: "10:00" }],
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

describe("exceptionLabel", () => {
  it("shows a single day once and the reason after it", () => {
    expect(
      exceptionLabel({
        startsOn: "2026-10-01",
        endsOn: "2026-10-01",
        reason: null,
      }),
    ).toBe("2026-10-01");
    expect(
      exceptionLabel({
        startsOn: "2026-10-01",
        endsOn: "2026-10-03",
        reason: "İzin",
      }),
    ).toBe("2026-10-01 – 2026-10-03 · İzin");
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
    expect(
      nextRangeAfter([{ ...draft().ranges[0], endTime: "23:30" }]),
    ).toEqual({ startTime: "23:30", endTime: "23:59" });
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
