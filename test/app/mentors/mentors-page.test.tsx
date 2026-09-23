import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorsPage from "@/app/mentors/page";
import { UserRole } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/mentors", () => ({
  loadMentors: async () => ({ mentors: [] }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/mentors/mentors-directory", () => ({
  MentorsDirectory: () => <p>Mentor dizini</p>,
}));

function signInAs(role: UserRole) {
  vi.mocked(getSessionUser).mockResolvedValue({ role } as Awaited<
    ReturnType<typeof getSessionUser>
  >);
}

describe("MentorsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a mentee to the mentor pool in Mentorluklarım", async () => {
    signInAs(UserRole.Mentee);

    await expect(MentorsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/mentorships?tab=mentor-pool");
  });

  it("keeps the directory for a coordinator", async () => {
    signInAs(UserRole.Coordinator);

    render(await MentorsPage());

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByText("Mentor dizini")).toBeInTheDocument();
  });
});
