import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChangeFounderSection } from "@/components/admin/change-founder-section";
import { getPersonSummary } from "@/lib/client/person-summary";
import { menteeSummary } from "@test/fixtures/person-summary";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/person-summary", () => ({
  getPersonSummary: vi.fn(),
}));

vi.mock("@/lib/client/founder-change", () => ({
  getFounderChangeOptions: vi.fn(),
  changeFounder: vi.fn(),
}));

describe("ChangeFounderSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("offers changing the founder of the person's startup", async () => {
    vi.mocked(getPersonSummary).mockResolvedValue(menteeSummary());
    renderWithQueryClient(<ChangeFounderSection userId="mentee-1" />);

    expect(
      await screen.findByText(
        "Pazar Lab girişiminin kurucusunu takımdaki başka bir üyeye devredin.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Kurucuyu değiştir" }),
    ).toBeInTheDocument();
  });

  it("stays away for someone without a startup", async () => {
    vi.mocked(getPersonSummary).mockResolvedValue(
      menteeSummary({ startup: null }),
    );
    renderWithQueryClient(<ChangeFounderSection userId="mentee-1" />);

    await vi.waitFor(() => expect(getPersonSummary).toHaveBeenCalled());
    expect(
      screen.queryByRole("button", { name: "Kurucuyu değiştir" }),
    ).not.toBeInTheDocument();
  });
});
