import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import WorkspacePage from "@/app/workspace/page";
import { UserRole, type AppSession } from "@/interfaces/session";

const push = vi.fn();
const mockuseAppSession = vi.fn<() => AppSession | null>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
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

describe("WorkspacePage routing", () => {
  it("sends a mentor to /mentor-dashboard when picking a workspace", async () => {
    mockuseAppSession.mockReturnValue(mentorSession());
    const user = userEvent.setup();

    render(<WorkspacePage />);
    await user.click(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" })[0],
    );

    expect(push).toHaveBeenCalledWith("/mentor-dashboard");
  });

  it("sends an admin to /admin when picking a workspace", async () => {
    mockuseAppSession.mockReturnValue(adminSession());
    const user = userEvent.setup();

    render(<WorkspacePage />);
    await user.click(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" })[0],
    );

    expect(push).toHaveBeenCalledWith("/admin");
  });

  it("sends a coordinator to /programs when picking a workspace", async () => {
    mockuseAppSession.mockReturnValue({
      userId: "coord-1",
      email: "coordinator@teknokent.demo",
      fullName: "Demo Coordinator",
      jobTitle: "Koordinatör",
      role: UserRole.Coordinator,
    });
    const user = userEvent.setup();

    render(<WorkspacePage />);
    await user.click(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" })[0],
    );

    expect(push).toHaveBeenCalledWith("/programs");
  });

  it("sends a mentee to /dashboard when picking a workspace", async () => {
    mockuseAppSession.mockReturnValue(menteeSession());
    const user = userEvent.setup();

    render(<WorkspacePage />);
    await user.click(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" })[0],
    );

    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows exactly one card matching the real mentor session, not a hardcoded list", () => {
    mockuseAppSession.mockReturnValue(mentorSession());

    render(<WorkspacePage />);

    expect(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" }),
    ).toHaveLength(1);
    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
    expect(screen.getByText("Mentor")).toBeInTheDocument();
    expect(screen.queryByText("METUStars 2026")).not.toBeInTheDocument();
  });

  it("shows exactly one card matching the real mentee session, not a hardcoded list", () => {
    mockuseAppSession.mockReturnValue(menteeSession());

    render(<WorkspacePage />);

    expect(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" }),
    ).toHaveLength(1);
    expect(screen.getByText("NovaMed AI")).toBeInTheDocument();
    expect(screen.getByText("Girişim Ekibi")).toBeInTheDocument();
    expect(screen.queryByText("Eğitmen")).not.toBeInTheDocument();
  });
});
