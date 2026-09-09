import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { UserRole } from "@/interfaces/session";
import type { StartupContext } from "@/interfaces/startup";
import { mentorProfile } from "@test/fixtures/mentors";
import { renderWithQueryClient } from "@test/test-utils";

const pick = vi.hoisted(() => ({
  prepareRecommendations: vi.fn(),
}));

const nihan = {
  ...mentorProfile,
  id: "mentor-nihan",
  fullName: "Nihan Öztürk",
  initials: "NÖ",
  professionalTitle: "Ürün Yöneticisi",
  company: "ODTÜ TEKNOKENT",
  specialties: ["Strateji", "İş Modeli"],
};

const ali = {
  ...mentorProfile,
  id: "mentor-ali",
  fullName: "Ali Erdem",
  initials: "AE",
  professionalTitle: "Kurucu",
  company: "Demo",
  specialties: ["Satış"],
  recommendationReasons: [],
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("step=4"),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({
    userId: "user-1",
    email: "sudenaz@example.com",
    fullName: "Sudenaz Yılmaz",
    jobTitle: "Mentee",
    role: UserRole.Mentee,
    organizationId: "org-1",
    organizationName: "Team TNT",
  }),
}));

vi.mock("@/hooks/use-mentor-request", async () => {
  const { mentorProfile: profile } = await import("@test/fixtures/mentors");
  const recommended = {
    ...profile,
    id: "mentor-nihan",
    fullName: "Nihan Öztürk",
    initials: "NÖ",
    professionalTitle: "Ürün Yöneticisi",
    company: "ODTÜ TEKNOKENT",
    specialties: ["Strateji", "İş Modeli"],
  };
  const extra = {
    ...profile,
    id: "mentor-ali",
    fullName: "Ali Erdem",
    initials: "AE",
    professionalTitle: "Kurucu",
    company: "Demo",
    specialties: ["Satış"],
    recommendationReasons: [],
  };
  return {
    useMentorRequest: () => ({
      baseMentors: [recommended, extra],
      isMatching: false,
      matchingError: "",
      mentors: [recommended],
      recommendedMentors: [recommended],
      prepareRecommendations: pick.prepareRecommendations,
      recommendationMetadata: {
        generatedAt: "2026-01-01",
        matchingMethod: "DETERMINISTIC",
      },
    }),
  };
});

const startup: StartupContext = {
  organizationId: "org-1",
  name: "Team TNT",
  summary: "B2B, SaaS Mentör-Mentee Platformu",
  sector: "",
  stage: "",
  technologies: [],
  confirmedProfile: false,
};

describe("MentorRequestFlow — mentor pick", () => {
  it("opens Önerilen mentors after Özet Devam et, and Tümü lists everyone", async () => {
    pick.prepareRecommendations.mockResolvedValue({
      mentors: [nihan],
      metadata: { generatedAt: "2026-01-01", matchingMethod: "DETERMINISTIC" },
    });
    const user = userEvent.setup();
    renderWithQueryClient(
      <MentorRequestFlow mentors={[nihan, ali]} startup={startup} />,
    );

    expect(
      screen.getByRole("heading", { name: "Seni doğru anladık mı?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(pick.prepareRecommendations).toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: "Önerilen" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("En Uygun Mentorlar")).toBeInTheDocument();
    expect(screen.getByText("Nihan Öztürk")).toBeInTheDocument();
    expect(screen.queryByText("Ali Erdem")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Tümü" }));

    expect(screen.getByText("Tüm Mentorlar")).toBeInTheDocument();
    expect(screen.getByText("Nihan Öztürk")).toBeInTheDocument();
    expect(screen.getByText("Ali Erdem")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Geri" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Devam/i }),
    ).not.toBeInTheDocument();
  });
});
