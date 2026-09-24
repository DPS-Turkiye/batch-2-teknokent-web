import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WorkspacePage from "@/app/workspace/page";
import { UserRole, type AppSession } from "@/interfaces/session";

const replace = vi.fn();
const mockuseAppSession = vi.fn<() => AppSession | null>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockuseAppSession(),
  useSession: () => ({
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    session: mockuseAppSession(),
  }),
}));

function mentorSession(): AppSession {
  return {
    userId: "mentor-1",
    email: "leyla.aksoy@teknokent.demo",
    fullName: "Leyla Aksoy",
    jobTitle: "Mentor",
    role: UserRole.Mentor,
  };
}

function menteeSession(): AppSession {
  return {
    userId: "mentee-1",
    email: "ayse.kaya@novamed.demo",
    fullName: "Ayşe Kaya",
    jobTitle: "Kurucu & CEO",
    organizationId: "org-1",
    organizationName: "NovaMed AI",
    role: UserRole.Mentee,
  };
}

function adminSession(): AppSession {
  return {
    userId: "admin-1",
    email: "admin@teknokent.demo",
    fullName: "Demo Administrator",
    jobTitle: "Koordinatör",
    role: UserRole.Admin,
  };
}

function coordinatorSession(): AppSession {
  return {
    userId: "coordinator-1",
    email: "coordinator@teknokent.demo",
    fullName: "Demo Koordinatör",
    jobTitle: "Koordinatör",
    role: UserRole.Coordinator,
  };
}

describe("WorkspacePage routing", () => {
  beforeEach(() => {
    replace.mockReset();
    mockuseAppSession.mockReset();
  });

  // Reported: the workspace picker appeared even though there is only ever one
  // workspace to pick, so it asked for a confirmation on every single login.
  it("forwards a mentor to /mentor-dashboard without asking", () => {
    mockuseAppSession.mockReturnValue(mentorSession());

    render(<WorkspacePage />);

    expect(replace).toHaveBeenCalledWith("/mentor-dashboard");
  });

  it("forwards a mentee to /dashboard without asking", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(<WorkspacePage />);

    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("forwards an admin to /admin without asking", () => {
    mockuseAppSession.mockReturnValue(adminSession());

    render(<WorkspacePage />);

    expect(replace).toHaveBeenCalledWith("/admin");
  });

  it("forwards a coordinator to /coordinator without asking", () => {
    mockuseAppSession.mockReturnValue(coordinatorSession());

    render(<WorkspacePage />);

    expect(replace).toHaveBeenCalledWith("/coordinator");
  });

  it("waits for the session rather than guessing a destination", () => {
    mockuseAppSession.mockReturnValue(null);

    render(<WorkspacePage />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText(/Çalışma alanınız açılıyor/)).toBeInTheDocument();
  });
});
