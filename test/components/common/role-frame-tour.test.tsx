import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoleFrame } from "@/components/common/role-frame";
import { UserRole, type AppSession } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { odtuSession } from "@test/fixtures/product-tour";

let current: AppSession = odtuSession();
vi.mock("next/navigation", () => ({
  usePathname: () => "/student",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => current,
  useSession: () => ({ session: current, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/components/common/notification-menu", () => ({
  NotificationMenu: () => null,
}));
vi.mock("@/components/product-tour/product-tour", () => ({
  ProductTour: ({ workspace }: { workspace: Workspace }) => (
    <p>tour for {workspace}</p>
  ),
}));

beforeEach(() => {
  current = odtuSession({ permissions: [UserRole.Mentee] });
});

describe("RoleFrame product tour", () => {
  it("mounts the tour of the frame's workspace", () => {
    render(
      <RoleFrame
        workspace={Workspace.OdtuStudent}
        homeHref="/student"
        menuLabel="studentMenu"
        nav={[]}
      >
        <p>Home</p>
      </RoleFrame>,
    );
    expect(
      screen.getByText(`tour for ${Workspace.OdtuStudent}`),
    ).toBeInTheDocument();
  });

  it("has no tour in a staff frame", () => {
    current = {
      userId: "admin",
      fullName: "Admin",
      email: "admin@example.com",
      role: UserRole.Admin,
      jobTitle: "Admin",
    };
    render(
      <RoleFrame
        allowedRoles={[UserRole.Admin]}
        homeHref="/admin"
        menuLabel="adminMenu"
        nav={[]}
      >
        <p>Admin home</p>
      </RoleFrame>,
    );
    expect(screen.getByText("Admin home")).toBeInTheDocument();
    expect(screen.queryByText(/^tour for/)).not.toBeInTheDocument();
  });
});
