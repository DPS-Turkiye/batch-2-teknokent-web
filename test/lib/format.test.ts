import { describe, expect, it } from "vitest";

import { formatSlotDateTime } from "@/lib/format";

describe("formatSlotDateTime", () => {
  it("formats an ISO timestamp as a Turkish date and time", () => {
    const formatted = formatSlotDateTime("2026-08-21T10:00:00.000Z");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toContain(",");
  });
});
