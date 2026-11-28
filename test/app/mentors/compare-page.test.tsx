import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MentorComparisonPage from "@/app/mentors/compare/page";
import { getMentors } from "@/lib/client/mentors";
import { mentorProfileHref } from "@/lib/mentor-profile-request";
import { mentorProfile } from "@test/fixtures/mentors";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/mentors", () => ({ getMentors: vi.fn() }));

vi.mocked(getMentors).mockResolvedValue([
  {
    ...mentorProfile,
    specialties: ["Büyüme", "MVP testi"],
    meetingMode: "Yüz yüze",
  },
]);

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("MentorComparisonPage", () => {
  it("sends profile actions to the new mentor profile page", async () => {
    renderWithQueryClient(<MentorComparisonPage />);
    await screen.findByRole("link", { name: "Profili Görüntüle" });

    const profileHref = mentorProfileHref(mentorProfile.id);
    expect(
      screen.getByRole("link", { name: "Profili Görüntüle" }),
    ).toHaveAttribute("href", profileHref);
    expect(
      screen.getByRole("link", { name: "Mentorluk talebi gönder" }),
    ).toHaveAttribute("href", profileHref);
    expect(screen.queryByText("Bu Mentoru Seç")).not.toBeInTheDocument();
  });

  it("shows saved option values in English, keeping unknown ones as stored", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <MentorComparisonPage />
      </InLocale>,
    );

    expect(await screen.findByText("Meeting format")).toBeInTheDocument();
    expect(screen.getByText("In person")).toBeInTheDocument();
    expect(screen.getByText("Growth, MVP testi")).toBeInTheDocument();
  });
});
