import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import WorkspacePage from "@/app/workspace/page";
import { UserRole, type DemoSession } from "@/interfaces/session";

const push = vi.fn();
const mockUseDemoSession = vi.fn<() => DemoSession | null>();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useDemoSession: () => mockUseDemoSession(),
}));

function mentorSession(): DemoSession {
  return {
    userId: "mentor-1",
    email: "leyla.aksoy@teknokent.demo",
    fullName: "Leyla Aksoy",
    jobTitle: "Mentor",
    role: UserRole.Mentor,
  };
}

function menteeSession(): DemoSession {
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

describe("WorkspacePage routing", () => {
  it("sends a mentor to /mentor-dashboard when picking a workspace", async () => {
    mockUseDemoSession.mockReturnValue(mentorSession());
    const user = userEvent.setup();

    render(<WorkspacePage />);
    await user.click(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" })[0],
    );

    expect(push).toHaveBeenCalledWith("/mentor-dashboard");
  });

  it("sends a mentee to /dashboard when picking a workspace", async () => {
    mockUseDemoSession.mockReturnValue(menteeSession());
    const user = userEvent.setup();

    render(<WorkspacePage />);
    await user.click(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" })[0],
    );

    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  it("shows exactly one card matching the real mentor session, not a hardcoded list", () => {
    mockUseDemoSession.mockReturnValue(mentorSession());

    render(<WorkspacePage />);

    expect(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" }),
    ).toHaveLength(1);
    expect(screen.getByText("Leyla Aksoy")).toBeInTheDocument();
    expect(screen.getByText("Mentor")).toBeInTheDocument();
    expect(screen.queryByText("METUStars 2026")).not.toBeInTheDocument();
  });

  it("shows exactly one card matching the real mentee session, not a hardcoded list", () => {
    mockUseDemoSession.mockReturnValue(menteeSession());

    render(<WorkspacePage />);

    expect(
      screen.getAllByRole("button", { name: "Çalışma alanına geç" }),
    ).toHaveLength(1);
    expect(screen.getByText("NovaMed AI")).toBeInTheDocument();
    expect(screen.getByText("Girişim Ekibi")).toBeInTheDocument();
    expect(screen.queryByText("Eğitmen")).not.toBeInTheDocument();
  });
});
