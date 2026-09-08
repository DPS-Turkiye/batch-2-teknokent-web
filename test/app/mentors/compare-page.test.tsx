import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MentorComparisonPage from "@/app/mentors/compare/page";
import { mentorProfileHref } from "@/lib/mentor-profile-request";
import { mentorProfile } from "@test/fixtures/mentors";

vi.mock("@/lib/mentors", () => ({
  loadMentors: async () => ({ mentors: [mentorProfile] }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("MentorComparisonPage", () => {
  it("sends profile actions to the new mentor profile page", async () => {
    render(await MentorComparisonPage());

    const profileHref = mentorProfileHref(mentorProfile.id);
    expect(
      screen.getByRole("link", { name: "Profili Görüntüle" }),
    ).toHaveAttribute("href", profileHref);
    expect(
      screen.getByRole("link", { name: "Mentorluk talebi gönder" }),
    ).toHaveAttribute("href", profileHref);
    expect(screen.queryByText("Bu Mentoru Seç")).not.toBeInTheDocument();
  });
});
