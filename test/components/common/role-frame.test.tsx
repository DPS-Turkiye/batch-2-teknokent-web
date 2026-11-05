import { render, screen } from "@testing-library/react";
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
