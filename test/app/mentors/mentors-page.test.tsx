import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorsPage from "@/app/mentors/page";
import { useAppSession } from "@/components/providers/session-provider";
import { UserRole } from "@/interfaces/session";
import { appSession } from "@test/fixtures/session";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: vi.fn(),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/mentors/mentors-directory", () => ({
  MentorsDirectory: () => <p>Mentor dizini</p>,
}));

describe("MentorsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a mentee to the mentor pool in Mentorluklarım", () => {
    vi.mocked(useAppSession).mockReturnValue(
      appSession({ role: UserRole.Mentee }),
    );

    render(<MentorsPage />);

    expect(replace).toHaveBeenCalledWith("/mentorships?tab=mentor-pool");
    expect(screen.queryByText("Mentor dizini")).not.toBeInTheDocument();
  });

  it("keeps the directory for a coordinator", () => {
    vi.mocked(useAppSession).mockReturnValue(
      appSession({ role: UserRole.Coordinator }),
    );

    render(<MentorsPage />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Mentor dizini")).toBeInTheDocument();
  });

  it("waits for the session before showing anything", () => {
    vi.mocked(useAppSession).mockReturnValue(null);

    render(<MentorsPage />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.queryByText("Mentor dizini")).not.toBeInTheDocument();
  });
});
