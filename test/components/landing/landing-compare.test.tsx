import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LandingCompare } from "@/components/landing/landing-compare";
import en from "@/messages/en.json";
import { InLocale } from "@test/test-utils";

describe("LandingCompare", () => {
  it("keeps revealed bullets visible when the language changes", () => {
    const { rerender } = render(
      <InLocale locale="tr">
        <LandingCompare onDifference={vi.fn()} />
      </InLocale>,
    );
    // The reveal hook marks each bullet as shown once, on the first load only.
    screen
      .getAllByRole("listitem")
      .forEach((item) => item.classList.add("shown"));

    rerender(
      <InLocale locale="en">
        <LandingCompare onDifference={vi.fn()} />
      </InLocale>,
    );

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      ...en.landing.compare.mentoring.points,
      ...en.landing.compare.training.points,
    ]);
    items.forEach((item) => expect(item).toHaveClass("shown"));
  });
});
