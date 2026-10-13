import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { useOptionLabel } from "@/hooks/use-option-label";
import { InLocale } from "@test/test-utils";

function english({ children }: { children: ReactNode }) {
  return <InLocale locale="en">{children}</InLocale>;
}

describe("useOptionLabel", () => {
  it("shows a saved Turkish option value in English", () => {
    const { result } = renderHook(() => useOptionLabel(), {
      wrapper: english,
    });

    expect(result.current("stage", "Fikir")).toBe("Idea");
    expect(result.current("supportArea", "Ürün & UX")).toBe("Product & UX");
    expect(result.current("meetingFormat", "Yüz yüze")).toBe("In person");
    expect(result.current("fundingStage", "Seri A")).toBe("Series A");
  });

  it("keeps the Turkish text in Turkish", () => {
    const { result } = renderHook(() => useOptionLabel());

    expect(result.current("stage", "Fikir")).toBe("Fikir");
  });

  it("shows a value the list doesn't know as stored", () => {
    const { result } = renderHook(() => useOptionLabel(), {
      wrapper: english,
    });

    expect(result.current("mentorTopic", "Kuantum Bilişim")).toBe(
      "Kuantum Bilişim",
    );
    expect(result.current("responseTime", "~4 saat")).toBe("~4 saat");
  });
});
