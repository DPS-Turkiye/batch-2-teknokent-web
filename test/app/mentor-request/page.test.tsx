import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorRequestPage from "@/app/mentor-request/page";
import { useSession } from "@/components/providers/session-provider";
import type { AppSession } from "@/interfaces/session";
import { getMentors } from "@/lib/client/mentors";
import { loadStartupContext } from "@/lib/client/startup-context";
import { mentorProfile } from "@test/fixtures/mentors";
import { appSession } from "@test/fixtures/session";
import { renderWithQueryClient } from "@test/test-utils";

const replace = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: vi.fn(),
}));
vi.mock("@/lib/client/mentors", () => ({ getMentors: vi.fn() }));
vi.mock("@/lib/client/startup-context", () => ({
  loadStartupContext: vi.fn(),
}));
vi.mock("@/components/mentor-request/mentor-request-flow", () => ({
  MentorRequestFlow: ({ mentors }: { mentors: unknown[] }) => (
    <p>{`Talep akışı: ${mentors.length} mentor`}</p>
  ),
}));

function signedIn(session: AppSession | null, isLoading = false) {
  vi.mocked(useSession).mockReturnValue({
    isLoading,
    session,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  });
}

describe("MentorRequestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a visitor without a session to the login page", () => {
    signedIn(null);

    renderWithQueryClient(<MentorRequestPage />);

    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("waits while the session is still loading", () => {
    signedIn(null, true);

    renderWithQueryClient(<MentorRequestPage />);

    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a signed-in mentee without a startup to Startup'ım", () => {
    signedIn(appSession({ organizationId: undefined }));

    renderWithQueryClient(<MentorRequestPage />);

    expect(replace).toHaveBeenCalledWith("/startup");
    expect(getMentors).not.toHaveBeenCalled();
  });

  it("opens the request flow with the mentors and the caller's startup", async () => {
    signedIn(appSession({ organizationId: "org-1" }));
    vi.mocked(getMentors).mockResolvedValue([mentorProfile]);
    vi.mocked(loadStartupContext).mockResolvedValue({
      startup: {
        organizationId: "org-1",
        name: "Kargo AI",
        summary: "",
        sector: "",
        stage: "",
        technologies: [],
        confirmedProfile: false,
      },
    });

    renderWithQueryClient(<MentorRequestPage />);

    expect(
      await screen.findByText("Talep akışı: 1 mentor"),
    ).toBeInTheDocument();
    expect(loadStartupContext).toHaveBeenCalledWith(
      "org-1",
      expect.any(String),
    );
    expect(replace).not.toHaveBeenCalled();
  });
});
