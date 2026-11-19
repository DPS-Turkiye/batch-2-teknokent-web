import { describe, expect, it } from "vitest";

import { qrShape } from "@/lib/qr-code";

describe("qrShape", () => {
  it("draws a square code with its three finder patterns", () => {
    const shape = qrShape("https://menton.app/attend/" + "A".repeat(43));

    // A 70-character link at error correction M needs a version 4 code: 33 × 33 modules.
    expect(shape.size).toBe(33);
    // Each finder pattern's top-left corner is a dark module.
    expect(shape.path).toContain("M0 0h1v1h-1z");
    expect(shape.path).toContain(`M${shape.size - 1} 0h1v1h-1z`);
    expect(shape.path).toContain(`M0 ${shape.size - 1}h1v1h-1z`);
  });

  it("draws a different code for a different link", () => {
    expect(qrShape("https://menton.app/attend/a").path).not.toBe(
      qrShape("https://menton.app/attend/b").path,
    );
  });
});
