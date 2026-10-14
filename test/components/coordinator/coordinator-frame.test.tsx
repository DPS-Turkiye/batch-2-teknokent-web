import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinatorFrame } from "@/components/coordinator/coordinator-frame";
import { type AppSession, UserRole } from "@/interfaces/session";
import { InLocale } from "@test/test-utils";

const mockSession = vi.fn<() => AppSession | null>();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/coordinator/programs",
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => mockSession(),
  useSession: () => ({ isLoading: false, logout: vi.fn() }),
}));

vi.mock("@/components/common/notification-menu", () => ({
  NotificationMenu: () => null,
}));

function session(role: UserRole): AppSession {
  return {
    userId: "user-1",
    email: "elif@tekno.test",
    fullName: "Elif Demir",
    jobTitle: null,
    role,
  } as AppSession;
}

describe("CoordinatorFrame", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the coordinator menu with Programlarım active", () => {
    mockSession.mockReturnValue(session(UserRole.Coordinator));

    render(
      <CoordinatorFrame>
        <p>Programlar içeriği</p>
      </CoordinatorFrame>,
    );

    const menu = screen.getByRole("navigation", { name: "Koordinatör menüsü" });
    expect(screen.getByRole("link", { name: "Programlarım" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Anasayfa" })).toHaveAttribute(
      "href",
      "/coordinator",
    );
    expect(screen.getByRole("link", { name: "Mentorluklar" })).toHaveAttribute(
      "href",
      "/coordinator/mentorships",
    );
    expect(screen.getByRole("link", { name: "Takvim" })).toHaveAttribute(
      "href",
      "/coordinator/calendar",
    );
    expect(screen.getByRole("link", { name: "Mesajlar" })).toHaveAttribute(
      "href",
      "/coordinator/messages",
    );
    expect(menu).not.toHaveTextContent("Yakında");
    expect(screen.getByText("Koordinatör")).toBeInTheDocument();
    expect(screen.getByText("Programlar içeriği")).toBeInTheDocument();
  });

  it("reads in English", () => {
    mockSession.mockReturnValue(session(UserRole.Coordinator));

    render(
      <InLocale locale="en">
        <CoordinatorFrame>
          <p>Programs</p>
        </CoordinatorFrame>
      </InLocale>,
    );

    expect(
      screen.getByRole("navigation", { name: "Coordinator menu" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My programs" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Coordinator")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toBeInTheDocument();
  });

  it("lets an admin in too", () => {
    mockSession.mockReturnValue(session(UserRole.Admin));

    render(
      <CoordinatorFrame>
        <p>Programlar içeriği</p>
      </CoordinatorFrame>,
    );

    expect(screen.getByText("Programlar içeriği")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sends a mentee back to their own home", () => {
    mockSession.mockReturnValue(session(UserRole.Mentee));

    render(
      <CoordinatorFrame>
        <p>Programlar içeriği</p>
      </CoordinatorFrame>,
    );

    expect(screen.queryByText("Programlar içeriği")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});
