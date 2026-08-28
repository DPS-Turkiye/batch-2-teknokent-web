import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { useDemoAccounts } from "@/hooks/use-demo-accounts";
import { UserRole, type BackendUser } from "@/interfaces/session";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login: vi.fn() }),
}));

vi.mock("@/hooks/use-demo-accounts", () => ({
  useDemoAccounts: vi.fn(),
}));

const MENTEE: BackendUser = {
  id: "mentee-1",
  email: "ayse.kaya@novamed.demo",
  fullName: "Ayşe Kaya",
  role: UserRole.Mentee,
  organizationId: "org-1",
  organizationName: "NovaMed AI",
};

const MENTOR: BackendUser = {
  id: "mentor-1",
  email: "leyla.aksoy@teknokent.demo",
  fullName: "Leyla Aksoy",
  role: UserRole.Mentor,
};

// The picker no longer filters client-side — GET /api/demo-accounts is
// role-scoped server-side, so this mirrors that: only the requested role's
// pool comes back.
function mockRoleScopedAccounts() {
  vi.mocked(useDemoAccounts).mockImplementation(
    (role: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee) =>
      ({
        data: role === UserRole.Mentor ? [MENTOR] : [MENTEE],
        isLoading: false,
        error: null,
      }) as ReturnType<typeof useDemoAccounts>,
  );
}

describe("LoginPage demo account list", () => {
  it("shows only mentor accounts once the Mentor role is selected", async () => {
    mockRoleScopedAccounts();
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: /Mentorluk ve Eğitim/ }),
    );
    // First checkbox in the open "Mentorluk ve Eğitim" group is Mentor.
    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByRole("button", { name: /görevle devam et/ }));

    expect(
      screen.getByRole("button", { name: /Leyla Aksoy/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Ayşe Kaya/ }),
    ).not.toBeInTheDocument();
    expect(useDemoAccounts).toHaveBeenCalledWith(UserRole.Mentor);
  });

  it("shows only mentee accounts once a startup-team role is selected", async () => {
    mockRoleScopedAccounts();
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /Girişim Ekibi/ }));
    // Second checkbox in the open "Girişim Ekibi" group is Mentee / Ekip Üyesi.
    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.click(screen.getByRole("button", { name: /görevle devam et/ }));

    expect(
      screen.getByRole("button", { name: /Ayşe Kaya/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Leyla Aksoy/ }),
    ).not.toBeInTheDocument();
    expect(useDemoAccounts).toHaveBeenCalledWith(UserRole.Mentee);
  });

  it("defaults to mentee accounts when a role with no backend pool is selected", async () => {
    mockRoleScopedAccounts();
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /Kurum Yönetimi/ }));
    // First checkbox in the open "Kurum Yönetimi" group is Admin.
    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByRole("button", { name: /görevle devam et/ }));

    expect(useDemoAccounts).toHaveBeenCalledWith(UserRole.Mentee);
  });
});

describe("LoginPage redesigned shell", () => {
  it("opens on the METUal welcome with the role groups", () => {
    mockRoleScopedAccounts();
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "METUal'a hoş geldin" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Mentorluk ve Eğitim/ }),
    ).toBeInTheDocument();
  });

  it("offers the sign-up route to new users from the role step", () => {
    mockRoleScopedAccounts();
    render(<LoginPage />);

    expect(
      screen.getByRole("link", { name: /Startup'ımla katıl/ }),
    ).toHaveAttribute("href", "/signup");
  });

  it("reaches the redesigned credentials step and can go back", async () => {
    mockRoleScopedAccounts();
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /Girişim Ekibi/ }));
    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.click(screen.getByRole("button", { name: /görevle devam et/ }));

    expect(
      screen.getByRole("button", { name: "Giriş yap" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/E-posta/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Görevleri değiştir/ }),
    );
    expect(
      screen.getByRole("button", { name: /görevle devam et/ }),
    ).toBeInTheDocument();
  });

  it("fills the email field from a demo account button", async () => {
    mockRoleScopedAccounts();
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /Girişim Ekibi/ }));
    await user.click(screen.getAllByRole("checkbox")[1]);
    await user.click(screen.getByRole("button", { name: /görevle devam et/ }));
    await user.click(screen.getByRole("button", { name: /Ayşe Kaya/ }));

    expect(screen.getByLabelText(/E-posta/)).toHaveValue(
      "ayse.kaya@novamed.demo",
    );
  });
});
