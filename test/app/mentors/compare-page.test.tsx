import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MentorComparisonPage from "@/app/mentors/compare/page";
import { mentorProfileHref } from "@/lib/mentor-profile-request";
import { mentorProfile } from "@test/fixtures/mentors";
import type { MessageNamespace, TestLocale } from "@test/i18n";

const page = vi.hoisted((): { locale: TestLocale } => ({ locale: "tr" }));

vi.mock("next-intl/server", async () => {
  const { translatorIn } = await import("@test/translators");
  return {
    getTranslations: async (namespace: MessageNamespace) =>
      translatorIn(page.locale, namespace),
  };
});

vi.mock("@/lib/mentors", () => ({
  loadMentors: async () => ({
    mentors: [
      {
        ...mentorProfile,
        specialties: ["Büyüme", "MVP testi"],
        meetingMode: "Yüz yüze",
      },
    ],
  }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("MentorComparisonPage", () => {
  afterEach(() => {
    page.locale = "tr";
  });

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

  it("shows saved option values in English, keeping unknown ones as stored", async () => {
    page.locale = "en";
    render(await MentorComparisonPage());

    expect(screen.getByText("Meeting format")).toBeInTheDocument();
    expect(screen.getByText("In person")).toBeInTheDocument();
    expect(screen.getByText("Growth, MVP testi")).toBeInTheDocument();
  });
});
