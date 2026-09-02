import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MentorsDirectory } from "@/components/mentors/mentors-directory";
import { mentorProfile } from "@test/fixtures/mentors";
import { renderWithQueryClient } from "@test/test-utils";

const leyla = {
  ...mentorProfile,
  id: "mentor-leyla",
  fullName: "Leyla Aksoy",
  initials: "LA",
  professionalTitle: "Growth Lead",
  company: "Peak Games",
  specialties: ["Büyüme", "Pazarlama"],
  sectorExperience: "Oyun",
  experienceLevel: "Growth",
  startupStages: "Series A",
};

describe("MentorsDirectory", () => {
  it("lists mentors as profile rows without a mentee-capacity badge", () => {
    renderWithQueryClient(
      <MentorsDirectory mentors={[mentorProfile, leyla]} />,
    );

    expect(
      screen.getByRole("link", { name: /Dr. Kemal Arslan/ }),
    ).toHaveAttribute("href", `/mentors/${mentorProfile.id}`);
    expect(
      screen.getByText("Kullanıcı araştırması & MVP testi"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Maks\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/mentee/i)).not.toBeInTheDocument();
  });

  it("filters the list from the search bar", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <MentorsDirectory mentors={[mentorProfile, leyla]} />,
    );

    await user.type(
      screen.getByRole("searchbox", { name: /Mentör ara/ }),
      "peak",
    );

    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
    expect(screen.queryByText("Dr. Kemal Arslan")).not.toBeInTheDocument();
  });

  it("says when search has no matches", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorsDirectory mentors={[mentorProfile]} />);

    await user.type(
      screen.getByRole("searchbox", { name: /Mentör ara/ }),
      "xyzzy",
    );

    expect(
      screen.getByText("Aramanıza uyan mentör bulunamadı."),
    ).toBeInTheDocument();
  });

  it("shows a load error", () => {
    renderWithQueryClient(<MentorsDirectory mentors={[]} error="boom" />);

    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    expect(
      screen.getByText("Henüz listelenecek mentör yok."),
    ).toBeInTheDocument();
  });
});
