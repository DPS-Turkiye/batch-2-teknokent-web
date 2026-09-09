import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorPickStep } from "@/components/mentor-request/mentor-pick-step";
import type { MentorPickFilterId } from "@/lib/mentor-request-pick";
import { mentorProfile } from "@test/fixtures/mentors";

const nihan = {
  ...mentorProfile,
  id: "mentor-nihan",
  fullName: "Nihan Öztürk",
  initials: "NÖ",
  professionalTitle: "Ürün Yöneticisi",
  company: "ODTÜ TEKNOKENT",
  specialties: ["Strateji", "İş Modeli"],
};

describe("MentorPickStep", () => {
  it("marks Önerilen as the default tab", () => {
    render(
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
    render(
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
