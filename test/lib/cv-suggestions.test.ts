import { describe, expect, it } from "vitest";

import { applyCvParse } from "@/lib/cv-suggestions";

const parsed = {
  role: "Product Manager",
  summary: "Ürün geliştiren bir yönetici.",
  expertise: ["UX", "Figma"],
};

describe("applyCvParse", () => {
  it("keeps what was typed when asked to, and fills what is empty", () => {
    expect(
      applyCvParse({ role: "Kurucu", bio: "", expertise: ["UX"] }, parsed, {
        keepFilled: true,
        bioMaxLength: 280,
      }),
    ).toEqual({
      role: "Kurucu",
      bio: "Ürün geliştiren bir yönetici.",
      expertise: ["UX", "Figma"],
    });
  });

  it("replaces the role and bio otherwise, but only adds to the expertise", () => {
    expect(
      applyCvParse(
        { role: "Kurucu", bio: "Eski", expertise: ["Satış"] },
        parsed,
        { keepFilled: false, bioMaxLength: 5000 },
      ),
    ).toEqual({
      role: "Product Manager",
      bio: "Ürün geliştiren bir yönetici.",
      expertise: ["Satış", "UX", "Figma"],
    });
  });

  it("never blanks a field the CV says nothing about, and trims a long bio", () => {
    expect(
      applyCvParse(
        { role: "Kurucu", bio: "Eski", expertise: [] },
        { role: "", summary: "abcdef", expertise: [] },
        { keepFilled: false, bioMaxLength: 3 },
      ),
    ).toEqual({ role: "Kurucu", bio: "abc", expertise: [] });
  });
});
