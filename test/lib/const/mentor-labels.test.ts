import { describe, expect, it } from "vitest";

import { MentorLabelColor } from "@/interfaces/mentor-label";
import { MENTOR_LABEL_PALETTE } from "@/lib/const/mentor-labels";

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [red = 0, green = 0, blue = 0] = channels;
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string) {
  const [light, dark] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  );
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

describe("mentor label palette", () => {
  it("has ten colors, one per palette key", () => {
    expect(Object.keys(MENTOR_LABEL_PALETTE).sort()).toEqual(
      Object.values(MentorLabelColor).sort(),
    );
  });

  it.each(Object.values(MentorLabelColor))(
    "keeps %s label text readable on its chip (WCAG AA, 4.5:1)",
    (color) => {
      const { background, text, chip, swatch } = MENTOR_LABEL_PALETTE[color];
      expect(contrast(background, text)).toBeGreaterThanOrEqual(4.5);
      expect(chip).toContain(`bg-[${background}]`);
      expect(chip).toContain(`text-[${text}]`);
      expect(swatch).toBe(`bg-[${text}]`);
    },
  );
});
