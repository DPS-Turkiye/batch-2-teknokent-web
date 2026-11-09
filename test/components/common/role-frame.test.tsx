import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoleFrame } from "@/components/common/role-frame";
import { UserRole } from "@/interfaces/session";

let pathname = "/admin";
const admin = {
  userId: "admin",
  fullName: "Admin",
  email: "admin@example.com",
  role: UserRole.Admin,
  jobTitle: "Admin",
};
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => admin,
  useSession: () => ({ session: admin, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/components/common/notification-menu", () => ({
  NotificationMenu: () => null,
}));

beforeEach(() => {
  pathname = "/admin";
});

describe("RoleFrame feedback", () => {
  it("shows the feedback tray trigger only on the role dashboard", () => {
    const frame = (
      <RoleFrame
        allowedRoles={[UserRole.Admin]}
        homeHref="/admin"
        menuLabel="adminMenu"
        nav={[]}
      >
        <p>Staff workspace</p>
      </RoleFrame>
    );
    const { rerender } = render(frame);
    expect(
      screen.getByRole("button", { name: "Geri bildirim" }),
    ).toBeInTheDocument();
    pathname = "/admin/feedback";
    rerender(
      <RoleFrame
        allowedRoles={[UserRole.Admin]}
        homeHref="/admin"
        menuLabel="adminMenu"
        nav={[]}
      >
        <p>Inbox</p>
      </RoleFrame>,
    );
    expect(
      screen.queryByRole("button", { name: "Geri bildirim" }),
    ).not.toBeInTheDocument();
  });
});

describe("RoleFrame workspace label", () => {
  it("names the workspace instead of the role when one is given", () => {
    render(
      <RoleFrame
        allowedRoles={[UserRole.Admin]}
        homeHref="/admin"
        menuLabel="adminMenu"
        nav={[]}
        roleLabel="Öğrenci"
      >
        <p>Workspace</p>
      </RoleFrame>,
    );
    expect(screen.getByText("Öğrenci")).toBeInTheDocument();
  });
});

describe("RoleFrame desktop nav between lg and xl", () => {
  it("drops icons, tightens items and keeps labels on one line until xl", () => {
    render(
      <RoleFrame
        allowedRoles={[UserRole.Admin]}
        homeHref="/admin"
        menuLabel="adminMenu"
        nav={[
          {
            href: "/admin",
            label: "home",
            icon: "/admin/nav-home.svg",
            match: (path) => path === "/admin",
          },
          {
            href: "/admin/users",
            label: "users",
            icon: "/admin/nav-users.svg",
            match: () => false,
            disabled: true,
          },
        ]}
      >
        <p>Workspace</p>
      </RoleFrame>,
    );
    const link = screen.getByRole("link", { name: "Anasayfa" });
    expect(link).toHaveClass("whitespace-nowrap", "px-3", "xl:px-[18px]");
    expect(link.querySelector("[aria-hidden]")).toHaveClass(
      "hidden",
      "xl:block",
    );
    const soon = screen.getByText("Kullanıcılar").closest("[aria-disabled]");
    expect(soon).toHaveClass("whitespace-nowrap", "px-3", "xl:px-[18px]");
    const account = document.querySelector<HTMLElement>(
      'button[aria-haspopup="menu"]',
    )!;
    expect(
      within(account).getAllByText("Admin")[0].closest("span.hidden"),
    ).toHaveClass("lg:hidden", "xl:block");
  });
});
