import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorRequestFlow } from "@/components/mentor-request/mentor-request-flow";
import { UserRole } from "@/interfaces/session";
import type { StartupContext } from "@/interfaces/startup";
import { getOrganizationPrograms } from "@/lib/client/programs";
import { MENTOR_REQUEST_NEED_DRAFT_KEY } from "@/lib/mentor-request-need";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/client/programs", () => ({
  getOrganizationPrograms: vi.fn(),
  setActiveProgram: vi.fn(),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-individual-program", () => ({
  useIndividualProgram: () => ({ individual: true, isLoading: false }),
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

const startup: StartupContext = {
  organizationId: "org-1",
  name: "Team TNT",
  summary: "B2B, SaaS Mentör-Mentee Platformu",
  sector: "",
  stage: "",
  technologies: [],
  confirmedProfile: false,
};

describe("MentorRequestFlow — a student of an individual program", () => {
  beforeEach(() => {
    push.mockReset();
    sessionStorage.clear();
    vi.mocked(getOrganizationPrograms).mockResolvedValue({
      programs: [{ id: "iskur", name: "İŞKUR", coordinatorName: "Elif" }],
      activeProgramId: "iskur",
    });
  });

  it("offers the student topics, not the startup ones", () => {
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    for (const topic of [
      "Kariyer planlama",
      "Staj",
      "CV & LinkedIn",
      "Erasmus & yurt dışı",
    ]) {
      expect(
        screen.getByRole("button", { name: new RegExp(topic) }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: /Başka bir konu/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Yatırım/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Büyüme & Satış/ }),
    ).not.toBeInTheDocument();
  });

  it("goes on to student situations", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: /Staj/ }));
    await user.click(screen.getByRole("button", { name: "Devam et" }));

    expect(
      screen.getByRole("button", { name: /Bir başvuruya hazırlanıyorum/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Onboarding sırasında/ }),
    ).not.toBeInTheDocument();
  });

  it("saves a draft with the student topic and situation", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    await user.click(screen.getByRole("button", { name: /Staj/ }));
    await user.click(
      screen.getByRole("button", { name: "Taslak Olarak Kaydet" }),
    );

    expect(
      JSON.parse(sessionStorage.getItem(MENTOR_REQUEST_NEED_DRAFT_KEY)!),
    ).toMatchObject({ topicId: "internship", situationId: "start" });
  });

  it("starts from a student topic when a saved draft holds a startup one", () => {
    sessionStorage.setItem(
      MENTOR_REQUEST_NEED_DRAFT_KEY,
      JSON.stringify({
        topicId: "investment",
        otherSummary: "",
        situationId: "focus",
      }),
    );
    renderWithQueryClient(<MentorRequestFlow mentors={[]} startup={startup} />);

    expect(
      screen.getByRole("button", { name: /Kariyer planlama/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
