import { describe, expect, it } from "vitest";

import { formatMeetingShort, formatSlotDateTime } from "@/lib/format";

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
