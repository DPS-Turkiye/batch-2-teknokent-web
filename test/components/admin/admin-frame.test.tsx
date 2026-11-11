import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminFrame } from "@/components/admin/admin-frame";
import { UserRole, type AppSession } from "@/interfaces/session";

const harness = vi.hoisted(() => ({ pathname: "/admin" }));
const mockSession = vi.fn<() => AppSession | null>();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => harness.pathname,
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
    userId: "admin-1",
    email: "admin@teknokent.demo",
    fullName: "Demo Admin",
    jobTitle: "",
    role,
  };
}

function renderAt(pathname: string) {
  harness.pathname = pathname;
  render(
    <AdminFrame>
      <p>İçerik</p>
    </AdminFrame>,
  );
  return within(screen.getByRole("navigation", { name: "Admin menüsü" }));
}

describe("AdminFrame", () => {
  beforeEach(() => {
    mockSession.mockReset();
    replace.mockReset();
    mockSession.mockReturnValue(session(UserRole.Admin));
  });

  it("links every admin section from the menu", () => {
    const menu = renderAt("/admin");

    expect(
      menu.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual([
      "/admin",
      "/admin/programs",
      "/admin/users",
      "/admin/mentorships",
      "/admin/feedback",
      "/admin/reporting",
    ]);
    expect(screen.getByText("İçerik")).toBeInTheDocument();
  });

  it("marks Anasayfa active only on the admin home itself", () => {
    const menu = renderAt("/admin");

    expect(menu.getByRole("link", { name: "Anasayfa" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(menu.getByRole("link", { name: "Programlar" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it.each([
    ["/admin/programs/new", "Programlar"],
    ["/admin/users/mentors", "Kullanıcılar"],
    ["/admin/mentorships/interventions", "Mentorluklar"],
    ["/admin/feedback", "Geri bildirim"],
    ["/admin/reporting", "Raporlama"],
  ])("marks the section of %s active", (pathname, label) => {
    const menu = renderAt(pathname);

    expect(menu.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(menu.getByRole("link", { name: "Anasayfa" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("sends a coordinator to their own home instead of showing the admin frame", () => {
    mockSession.mockReturnValue(session(UserRole.Coordinator));
    harness.pathname = "/admin";

    render(
      <AdminFrame>
        <p>İçerik</p>
      </AdminFrame>,
    );

    expect(screen.queryByText("İçerik")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/coordinator");
  });
});
