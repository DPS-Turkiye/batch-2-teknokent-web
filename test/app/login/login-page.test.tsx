import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { useDemoAccounts } from "@/hooks/use-demo-accounts";
import type { BackendUser } from "@/interfaces/session";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login: vi.fn() }),
}));

vi.mock("@/hooks/use-demo-accounts", () => ({
  useDemoAccounts: vi.fn(),
}));

function accounts(): BackendUser[] {
  return [
    {
      id: "mentee-1",
      email: "ayse.kaya@novamed.demo",
      fullName: "Ayşe Kaya",
      role: "MENTEE",
      organizationId: "org-1",
      organizationName: "NovaMed AI",
    },
    {
      id: "mentor-1",
      email: "leyla.aksoy@teknokent.demo",
      fullName: "Leyla Aksoy",
      role: "MENTOR",
    },
  ];
}

function mockAccounts(data: BackendUser[]) {
  vi.mocked(useDemoAccounts).mockReturnValue({
    data,
    isLoading: false,
    error: null,
  } as ReturnType<typeof useDemoAccounts>);
}

describe("LoginPage demo account list", () => {
  it("shows only mentor accounts once the Mentor role is selected", async () => {
    mockAccounts(accounts());
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
  });

  it("shows only mentee accounts once a startup-team role is selected", async () => {
    mockAccounts(accounts());
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
  });

  it("shows every account when only a role with no backend pool is selected", async () => {
    mockAccounts(accounts());
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /Kurum Yönetimi/ }));
    // First checkbox in the open "Kurum Yönetimi" group is Admin.
    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.click(screen.getByRole("button", { name: /görevle devam et/ }));

    expect(
      screen.getByRole("button", { name: /Leyla Aksoy/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ayşe Kaya/ }),
    ).toBeInTheDocument();
  });
});
