import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoleFrame } from "@/components/common/role-frame";
import { IdentityKind, UserRole, type AppSession } from "@/interfaces/session";
import { Workspace } from "@/interfaces/workspace";
import { IaAccent } from "@/types/ia-theme";
import { itemAt } from "@test/fixtures/list-assertions";
import { renderWithQueryClient } from "@test/test-utils";

let pathname = "/admin";
const admin: AppSession = {
  userId: "admin",
  fullName: "Admin",
  email: "admin@example.com",
  role: UserRole.Admin,
  jobTitle: "Admin",
};
let current: AppSession = admin;
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  SESSION_QUERY_KEY: ["session"],
  useAppSession: () => current,
  useSession: () => ({ session: current, isLoading: false, logout: vi.fn() }),
}));
// The theme test checks only the frame's paint, so it lets the student in whatever the deployment's edition is.
const gate = vi.hoisted(() => ({ forceAllowed: false }));
vi.mock("@/hooks/use-role-gate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-role-gate")>();
  return {
    useRoleGate: (...args: Parameters<typeof actual.useRoleGate>) => {
      const real = actual.useRoleGate(...args);
      return gate.forceAllowed
        ? { ...real, allowed: true, isLoading: false }
        : real;
    },
  };
});
vi.mock("@/components/common/notification-menu", () => ({
  NotificationMenu: () => null,
}));

beforeEach(() => {
  gate.forceAllowed = false;
  pathname = "/admin";
  current = admin;
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
    expect(link).toHaveAttribute("data-tour", "nav-home");
    expect(link).toHaveClass("whitespace-nowrap", "px-3", "xl:px-4");
    expect(link.querySelector("[aria-hidden]")).toHaveClass(
      "hidden",
      "xl:block",
    );
    const soon = screen.getByText("Kullanıcılar").closest("[aria-disabled]");
    expect(soon).toHaveClass("whitespace-nowrap", "px-3", "xl:px-4");
    expect(soon).toHaveAttribute("data-tour", "nav-users");
    const account = document.querySelector<HTMLElement>(
      'button[aria-haspopup="menu"]',
    )!;
    expect(
      itemAt(within(account).getAllByText("Admin"), 0).closest("span.hidden"),
    ).toHaveClass("lg:hidden", "xl:block");
  });
});

describe("RoleFrame workspace switch", () => {
  const assistant: AppSession = {
    userId: "u-1",
    email: "elif@odtu-dev.invalid",
    fullName: "Elif Şahin",
    jobTitle: "Akademisyen",
    role: UserRole.Academician,
    permissions: [UserRole.Mentee, UserRole.Academician],
    institutionKinds: [IdentityKind.Student, IdentityKind.Academic],
  };
  const frame = (
    <RoleFrame
      allowedRoles={Object.values(UserRole)}
      homeHref="/academician"
      menuLabel="academicianMenu"
      nav={[]}
    >
      <p>Workspace</p>
    </RoleFrame>
  );

  it("lets an account with two workspaces switch from the account menu", async () => {
    const user = userEvent.setup();
    current = assistant;
    renderWithQueryClient(frame);
    await user.click(
      document.querySelector<HTMLElement>('button[aria-haspopup="menu"]')!,
    );
    const menu = screen.getByRole("menu");
    expect(
      within(menu).getByRole("menuitemradio", { name: /Akademisyen/ }),
    ).toBeVisible();
    expect(
      within(menu).getByRole("menuitemradio", { name: /ODTÜ Öğrenci/ }),
    ).toBeVisible();
  });

  it("shows no switch for an account with one workspace", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(frame);
    await user.click(
      document.querySelector<HTMLElement>('button[aria-haspopup="menu"]')!,
    );
    expect(screen.queryByRole("menuitemradio")).toBeNull();
  });
});

describe("RoleFrame theme", () => {
  const student: AppSession = {
    userId: "s-1",
    email: "ayse@odtu-dev.invalid",
    fullName: "Ayşe Yılmaz",
    jobTitle: "",
    role: UserRole.Mentee,
    permissions: [UserRole.Mentee],
    institutionKinds: [IdentityKind.Student],
  };

  it("paints the ODTÜ workspaces in ODTÜ red and staff frames in ink", () => {
    gate.forceAllowed = true;
    current = student;
    const { container, unmount } = renderWithQueryClient(
      <RoleFrame
        workspace={Workspace.OdtuStudent}
        homeHref="/student"
        menuLabel="studentMenu"
        nav={[]}
      >
        <p>Student</p>
      </RoleFrame>,
    );
    expect(container.querySelector("[data-ia-accent]")).toHaveAttribute(
      "data-ia-accent",
      IaAccent.Odtu,
    );
    unmount();

    // Figma "Nav / Akademisyen" (78:838) uses the same red pill as the student nav.
    const academician = renderWithQueryClient(
      <RoleFrame
        workspace={Workspace.OdtuAcademician}
        homeHref="/academician"
        menuLabel="academicianMenu"
        nav={[]}
      >
        <p>Academician</p>
      </RoleFrame>,
    );
    expect(
      academician.container.querySelector("[data-ia-accent]"),
    ).toHaveAttribute("data-ia-accent", IaAccent.Odtu);
    academician.unmount();

    const coordinator = renderWithQueryClient(
      <RoleFrame
        workspace={Workspace.Coordinator}
        homeHref="/coordinator"
        menuLabel="adminMenu"
        nav={[]}
      >
        <p>Coordinator</p>
      </RoleFrame>,
    );
    expect(coordinator.container.querySelector("[data-ia-accent]")).toBeNull();
    coordinator.unmount();

    current = admin;
    const staff = renderWithQueryClient(
      <RoleFrame
        allowedRoles={[UserRole.Admin]}
        homeHref="/admin"
        menuLabel="adminMenu"
        nav={[]}
      >
        <p>Admin</p>
      </RoleFrame>,
    );
    expect(staff.container.querySelector("[data-ia-accent]")).toBeNull();
    gate.forceAllowed = false;
    expect(screen.getByText("Admin", { selector: "p" })).toBeInTheDocument();
  });
});
