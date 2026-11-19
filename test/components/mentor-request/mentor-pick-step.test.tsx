import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorPickStep } from "@/components/mentor-request/mentor-pick-step";
import { MentorLabelColor } from "@/interfaces/mentor-label";
import { getMentorLabelDirectory } from "@/lib/client/mentor-labels";
import type { MentorPickFilterId } from "@/lib/mentor-request-pick";
import { mentorProfile } from "@test/fixtures/mentors";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

const nihan = {
  ...mentorProfile,
  id: "mentor-nihan",
  fullName: "Nihan Öztürk",
  initials: "NÖ",
  professionalTitle: "Ürün Yöneticisi",
  company: "ODTÜ TEKNOKENT",
  specialties: ["Strateji", "İş Modeli"],
};

vi.mock("@/lib/client/mentor-labels", () => ({
  getMentorLabelDirectory: vi.fn(),
}));

describe("MentorPickStep", () => {
  beforeEach(() => {
    vi.mocked(getMentorLabelDirectory).mockResolvedValue({
      programId: null,
      labels: [],
      mentors: [],
    });
  });

  it("shows the mentor's program labels under the title, above Neden önerildi?", async () => {
    vi.mocked(getMentorLabelDirectory).mockResolvedValue({
      programId: "program-1",
      labels: [
        { id: "fintech", name: "Fintech", color: MentorLabelColor.Green },
      ],
      mentors: [{ mentorId: nihan.id, labelIds: ["fintech"] }],
    });
    renderWithQueryClient(
      <MentorPickStep
        filter="recommended"
        listedMentors={[
          { ...nihan, recommendationReasons: ["Strateji deneyimi"] },
        ]}
        mentorId=""
        onFilterChange={vi.fn()}
      />,
    );

    const chips = await screen.findByRole("list", { name: "Etiketler" });
    expect(within(chips).getByText("Fintech")).toBeInTheDocument();
    const title = screen.getByText("Ürün Yöneticisi · ODTÜ TEKNOKENT");
    const why = screen.getByText("Neden önerildi?");
    expect(
      title.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      chips.compareDocumentPosition(why) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <MentorPickStep
          filter="recommended"
          listedMentors={[]}
          mentorId=""
          onFilterChange={vi.fn()}
        />
      </InLocale>,
    );

    expect(screen.getByRole("tab", { name: "Recommended" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Best-matched mentors" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No mentors were suggested for this need/),
    ).toBeInTheDocument();
  });

  it("marks Önerilen as the default tab", () => {
    renderWithQueryClient(
      <MentorPickStep
        filter="recommended"
        listedMentors={[nihan]}
        mentorId={nihan.id}
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: "Önerilen" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Tümü" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByText("En Uygun Mentorlar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nihan Öztürk/ })).toHaveAttribute(
      "href",
      "/mentors/mentor-nihan",
    );
    expect(screen.getByText("Profili Gör")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mentor Seç" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Seçildi" }),
    ).not.toBeInTheDocument();
  });

  it("switches the active tab", async () => {
    const onFilterChange = vi.fn<(filter: MentorPickFilterId) => void>();
    const user = userEvent.setup();
    renderWithQueryClient(
      <MentorPickStep
        filter="recommended"
        listedMentors={[nihan]}
        mentorId={nihan.id}
        onFilterChange={onFilterChange}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Tümü" }));
    expect(onFilterChange).toHaveBeenCalledWith("all");
  });
});
