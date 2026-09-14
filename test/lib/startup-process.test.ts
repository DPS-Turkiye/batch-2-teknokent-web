import { describe, expect, it } from "vitest";

import { StartupStage } from "@/interfaces/startup-process";
import { formatRoundRange, STARTUP_STAGE_LABELS } from "@/lib/startup-process";

describe("formatRoundRange", () => {
  it("names the month once when the round stays within it", () => {
    expect(formatRoundRange("2026-08-02", "2026-08-31")).toBe("2 · 31 Ağu");
  });

  it("names both months when the round crosses into the next", () => {
    expect(formatRoundRange("2026-07-28", "2026-08-05")).toBe("28 Tem · 5 Ağu");
  });
});

describe("STARTUP_STAGE_LABELS", () => {
  it("labels every stage in Turkish", () => {
    expect(STARTUP_STAGE_LABELS[StartupStage.BusinessModel]).toBe("İş Modeli");
    expect(Object.keys(STARTUP_STAGE_LABELS)).toHaveLength(7);
  });
});
