import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MenteeMentorLabels } from "@/components/mentor-labels/mentee-mentor-labels";
import { MentorProgramLabels } from "@/components/mentor-labels/mentor-program-labels";
import { MentorLabelColor } from "@/interfaces/mentor-label";
import {
  getMentorLabelDirectory,
  getMentorProgramLabels,
} from "@/lib/client/mentor-labels";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentor-labels", () => ({
  getMentorProgramLabels: vi.fn(),
  getMentorLabelDirectory: vi.fn(),
}));

const BUILD = {
  programId: "build",
  programName: "Build '26",
  labels: [
    { id: "ai", name: "AI", color: MentorLabelColor.Teal },
    { id: "fintech", name: "Fintech", color: MentorLabelColor.Green },
  ],
};
const GROWTH = {
  programId: "growth",
  programName: "Growth",
  labels: [{ id: "sales", name: "Satış", color: MentorLabelColor.Orange }],
};

describe("MentorProgramLabels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows one program at a time, chosen from the picker", async () => {
    const user = userEvent.setup();
    vi.mocked(getMentorProgramLabels).mockResolvedValue([BUILD, GROWTH]);
    renderWithQueryClient(<MentorProgramLabels mentorId="mentor-1" own />);

    const section = await screen.findByRole("region", { name: "Etiketler" });
    expect(within(section).getByText("AI")).toBeInTheDocument();
    expect(within(section).queryByText("Satış")).toBeNull();
    expect(
      within(section).getByText(/Etiketleri yalnızca koordinatörler/),
    ).toBeInTheDocument();

    await user.selectOptions(
      within(section).getByLabelText("Program"),
      "growth",
    );
    expect(within(section).getByText("Satış")).toBeInTheDocument();
    expect(within(section).queryByText("AI")).toBeNull();
    expect(getMentorProgramLabels).toHaveBeenCalledWith("mentor-1");
  });

  it("names the program without a picker when there is only one", async () => {
    vi.mocked(getMentorProgramLabels).mockResolvedValue([GROWTH]);
    renderWithQueryClient(<MentorProgramLabels mentorId="mentor-1" />);

    const section = await screen.findByRole("region", { name: "Etiketler" });
    expect(within(section).getByText("Growth")).toBeInTheDocument();
    expect(within(section).queryByLabelText("Program")).toBeNull();
    expect(within(section).queryByText(/yalnızca koordinatörler/)).toBeNull();
  });

  it("renders nothing when the mentor has no labels the viewer may see", async () => {
    vi.mocked(getMentorProgramLabels).mockResolvedValue([]);
    renderWithQueryClient(<MentorProgramLabels mentorId="mentor-1" />);

    await vi.waitFor(() => {
      expect(getMentorProgramLabels).toHaveBeenCalled();
    });
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryByText("Etiketler")).toBeNull();
  });
});

describe("MenteeMentorLabels", () => {
  it("shows the mentor's labels from the mentee's program", async () => {
    vi.mocked(getMentorLabelDirectory).mockResolvedValue({
      programId: "build",
      labels: BUILD.labels,
      mentors: [{ mentorId: "mentor-1", labelIds: ["fintech"] }],
    });
    renderWithQueryClient(
      <>
        <MenteeMentorLabels mentorId="mentor-1" />
        <MenteeMentorLabels mentorId="mentor-2" />
      </>,
    );

    const chips = await screen.findByRole("list", { name: "Etiketler" });
    expect(within(chips).getAllByRole("listitem")).toHaveLength(1);
    expect(within(chips).getByText("Fintech")).toBeInTheDocument();
  });
});
