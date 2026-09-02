import { describe, expect, it } from "vitest";

import { toCvParseResult } from "@/hooks/use-cv-parse";

describe("toCvParseResult", () => {
  it("merges the three parsed lists into one expertise set", () => {
    const result = toCvParseResult({
      professional_functions: ["Ürün Yönetimi"],
      technologies: ["PyTorch"],
      industries: ["HealthTech"],
    });

    expect(result.expertise).toEqual([
      "Ürün Yönetimi",
      "PyTorch",
      "HealthTech",
    ]);
  });

  it("drops values repeated across those lists", () => {
    const result = toCvParseResult({
      professional_functions: ["Analitik"],
      technologies: ["Analitik", "Python"],
    });

    expect(result.expertise).toEqual(["Analitik", "Python"]);
  });

  it("drops blank and whitespace-only values", () => {
    const result = toCvParseResult({
      professional_functions: ["", "   ", "Ürün"],
      technologies: null,
    });

    expect(result.expertise).toEqual(["Ürün"]);
  });

  it("falls back to the desired role when the current one is missing", () => {
    expect(toCvParseResult({ desired_role: "CTO" }).role).toBe("CTO");
    expect(
      toCvParseResult({ current_role: "Kurucu", desired_role: "CTO" }).role,
    ).toBe("Kurucu");
  });

  it("returns empty fields for a CV that yielded nothing", () => {
    expect(toCvParseResult({})).toEqual({
      role: "",
      summary: "",
      expertise: [],
    });
  });

  it("survives nulls from the parser rather than throwing", () => {
    expect(
      toCvParseResult({
        current_role: null,
        professional_summary: null,
        professional_functions: null,
        technologies: null,
        industries: null,
      }),
    ).toEqual({ role: "", summary: "", expertise: [] });
  });
});
