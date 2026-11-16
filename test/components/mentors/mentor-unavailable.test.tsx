import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MentorUnavailable } from "@/components/mentors/mentor-unavailable";
import { InLocale } from "@test/test-utils";

describe("MentorUnavailable", () => {
  it("says the profile is not open and leads back to the Mentor Pool", () => {
    render(
      <InLocale locale="tr">
        <MentorUnavailable />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Bu mentor profili sana açık değil",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mentor Havuzu'na dön" }),
    ).toHaveAttribute("href", "/mentorships?tab=mentor-pool");
  });
});
