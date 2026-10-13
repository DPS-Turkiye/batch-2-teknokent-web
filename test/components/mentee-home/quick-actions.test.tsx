import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickActions } from "@/components/mentee-home/quick-actions";
import { InLocale } from "@test/test-utils";

describe("QuickActions", () => {
  it("offers the four actions from the design, each with its destination", () => {
    render(<QuickActions />);

    const actions = within(
      screen.getByRole("region", { name: "Hızlı işlemler" }),
    );
    expect(actions.getAllByRole("link")).toHaveLength(4);
    expect(actions.getByRole("link", { name: /Mentor bul/ })).toHaveAttribute(
      "href",
      "/mentor-request",
    );
    expect(
      actions.getByRole("link", { name: /Toplantı planla/ }),
    ).toHaveAttribute("href", "/calendar");
    expect(actions.getByRole("link", { name: /Dosya yükle/ })).toHaveAttribute(
      "href",
      "/startup/files",
    );
    expect(actions.getByRole("link", { name: /Görevlerim/ })).toHaveAttribute(
      "href",
      "/startup/process",
    );
  });

  it("reads in English", () => {
    render(
      <InLocale locale="en">
        <QuickActions />
      </InLocale>,
    );

    const actions = within(
      screen.getByRole("region", { name: "Quick actions" }),
    );
    expect(
      actions.getByRole("link", { name: /Find a mentor/ }),
    ).toHaveAttribute("href", "/mentor-request");
    expect(actions.getByText("Share a document")).toBeInTheDocument();
  });
});
