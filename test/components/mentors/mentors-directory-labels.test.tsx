import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorsDirectory } from "@/components/mentors/mentors-directory";
import { MentorLabelColor } from "@/interfaces/mentor-label";
import { getMentorLabelDirectory } from "@/lib/client/mentor-labels";
import { mentorProfile } from "@test/fixtures/mentors";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-individual-program", () => ({
  useIndividualProgram: () => ({ individual: false, isLoading: false }),
}));
vi.mock("@/lib/client/mentor-labels", () => ({
  getMentorLabelDirectory: vi.fn(),
}));

const leyla = {
  ...mentorProfile,
  id: "mentor-leyla",
  fullName: "Leyla Aksoy",
  initials: "LA",
};
const deniz = {
  ...mentorProfile,
  id: "mentor-deniz",
  fullName: "Deniz Kaya",
  initials: "DK",
};

describe("MentorsDirectory labels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMentorLabelDirectory).mockResolvedValue({
      programId: "program-1",
      labels: [
        { id: "ai", name: "AI", color: MentorLabelColor.Teal },
        { id: "fintech", name: "Fintech", color: MentorLabelColor.Green },
        { id: "unused", name: "Hukuk", color: MentorLabelColor.Gray },
      ],
      mentors: [
        { mentorId: mentorProfile.id, labelIds: ["ai", "fintech"] },
        { mentorId: "mentor-leyla", labelIds: ["fintech"] },
      ],
    });
  });

  it("shows each mentor's labels from the mentee's program", async () => {
    renderWithQueryClient(
      <MentorsDirectory mentors={[mentorProfile, leyla, deniz]} />,
    );

    const kemal = await screen.findByRole("link", { name: /Dr. Kemal Arslan/ });
    const chips = await within(kemal).findByRole("list", { name: "Etiketler" });
    expect(within(chips).getByText("AI")).toBeInTheDocument();
    expect(within(chips).getByText("Fintech")).toBeInTheDocument();
    expect(
      within(screen.getByRole("link", { name: /Deniz Kaya/ })).queryByRole(
        "list",
      ),
    ).toBeNull();
  });

  it("filters to mentors who carry every selected label and offers only carried labels", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <MentorsDirectory mentors={[mentorProfile, leyla, deniz]} />,
    );

    await user.click(await screen.findByText("Etiket"));
    expect(screen.queryByRole("checkbox", { name: "Hukuk" })).toBeNull();
    await user.click(screen.getByRole("checkbox", { name: "Fintech" }));
    expect(screen.queryByText("Deniz Kaya")).toBeNull();
    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "AI" }));
    expect(screen.queryByText("Leyla Aksoy")).toBeNull();
    expect(screen.getByText("Dr. Kemal Arslan")).toBeInTheDocument();
  });

  it("shows no labels and no filter when the program has none to show", async () => {
    vi.mocked(getMentorLabelDirectory).mockResolvedValue({
      programId: null,
      labels: [],
      mentors: [],
    });
    renderWithQueryClient(<MentorsDirectory mentors={[mentorProfile]} />);

    await screen.findByText("Dr. Kemal Arslan");
    expect(getMentorLabelDirectory).toHaveBeenCalled();
    expect(screen.queryByText("Etiket")).toBeNull();
    expect(screen.queryByRole("list", { name: "Etiketler" })).toBeNull();
  });
});
