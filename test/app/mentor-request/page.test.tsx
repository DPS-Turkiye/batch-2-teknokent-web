import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorRequestPage from "@/app/mentor-request/page";
import { UserRole } from "@/interfaces/session";
import { getSessionUser } from "@/lib/session";

class Redirected extends Error {}
const redirect = vi.fn((url: string) => {
  throw new Redirected(url);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirect(url),
}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));
vi.mock("@/lib/mentors", () => ({ loadMentors: vi.fn() }));
vi.mock("@/lib/startup-profile", () => ({ loadStartupContext: vi.fn() }));

describe("MentorRequestPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a visitor without a session to the login page", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    await expect(MentorRequestPage()).rejects.toThrow(Redirected);
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("sends a signed-in mentee without a startup to Startup'ım", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: "mentee-1",
      email: "zeynep@kargo.ai",
      fullName: "Zeynep Kaya",
      jobTitle: "Ürün",
      role: UserRole.Mentee,
    });

    await expect(MentorRequestPage()).rejects.toThrow(Redirected);
    expect(redirect).toHaveBeenCalledWith("/startup");
  });
});
