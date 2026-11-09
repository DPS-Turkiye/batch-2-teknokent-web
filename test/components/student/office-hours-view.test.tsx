import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentOfficeHoursView } from "@/components/student/office-hours-view";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

describe("StudentOfficeHoursView", () => {
  it("says Office Hours is not in Menton yet and where it is booked today, with no slots", () => {
    renderWithQueryClient(<StudentOfficeHoursView />);

    expect(
      screen.getByRole("heading", { name: "Office Hours yakında Menton'da" }),
    ).toBeVisible();
    expect(screen.getByText("Yakında")).toBeVisible();
    expect(screen.getByText(/Moodle sayfası üzerinden/)).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.getByRole("link", { name: "Akran mentörlüğüne git" }),
    ).toHaveAttribute("href", "/student/peer-mentoring");
  });

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StudentOfficeHoursView />
      </InLocale>,
    );

    expect(
      screen.getByRole("heading", { name: "Office Hours is coming to Menton" }),
    ).toBeVisible();
    expect(screen.getByText("Coming soon")).toBeVisible();
  });
});
