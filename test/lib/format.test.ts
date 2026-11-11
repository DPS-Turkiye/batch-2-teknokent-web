import { describe, expect, it } from "vitest";

import {
  formatDateRange,
  formatMeetingShort,
  formatSlotDateTime,
} from "@/lib/format";

describe("formatSlotDateTime", () => {
  it("formats an ISO timestamp as a Turkish date and time", () => {
    const formatted = formatSlotDateTime("2026-08-21T10:00:00.000Z");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toContain(",");
  });
});

describe("formatMeetingShort", () => {
  it("formats a meeting as a short Turkish date and time", () => {
    const formatted = formatMeetingShort("2026-08-30T08:00:00.000Z");
    expect(formatted).toContain("·");
    expect(formatted).toMatch(/Ağu|Ağustos|30/);
  });
});

describe("formatDateRange", () => {
  const dayMonth = new Intl.DateTimeFormat("tr", {
    day: "numeric",
    month: "long",
  });

  it("writes plain spaces around the dash, as browsers do", () => {
    expect(
      formatDateRange(dayMonth, new Date(2026, 10, 9), new Date(2026, 10, 13)),
    ).toBe("9 – 13 Kasım");
  });

  it("leaves no thin space in a range across months", () => {
    const formatted = formatDateRange(
      dayMonth,
      new Date(2026, 7, 31),
      new Date(2026, 8, 4),
    );
    expect(formatted).not.toMatch(/[\u2009\u202f]/);
    expect(formatted).toBe("31 Ağustos – 4 Eylül");
  });

  it("falls back to a single date when both ends are the same day", () => {
    const day = new Date(2026, 10, 9);
    expect(formatDateRange(dayMonth, day, day)).toBe("9 Kasım");
  });
});
