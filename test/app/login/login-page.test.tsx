import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";
import { useDemoAccounts } from "@/hooks/use-demo-accounts";
import { UserRole, type BackendUser } from "@/interfaces/session";

const push = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login }),
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

// The redesigned screen has no role-selection step, so it offers every demo
// account: one role-scoped request per role, concatenated for the picker.
function mockAccounts() {
  vi.mocked(useDemoAccounts).mockImplementation(
    (role: UserRole.Mentee | UserRole.Mentor = UserRole.Mentee) =>
      ({
        data: role === UserRole.Mentor ? [MENTOR] : [MENTEE],
        isLoading: false,
        error: null,
      }) as ReturnType<typeof useDemoAccounts>,
  );
}

beforeEach(() => {
  push.mockReset();
  login.mockReset();
  mockAccounts();
});

describe("Login screen", () => {
  it("renders the shared login frame", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: "METUal'a hoş geldin" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/E-posta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Şifre/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Şifremi unuttum" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Beni Hatırla")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Bir davet aldın mı? Davet kodunla devam et",
      }),
    ).toBeInTheDocument();
  });

  it("masks the password field", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/Şifre/)).toHaveAttribute("type", "password");
  });

  it("toggles Beni Hatırla", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const remember = screen.getByLabelText("Beni Hatırla");
    expect(remember).not.toBeChecked();

    await user.click(remember);
    expect(remember).toBeChecked();
  });

  it("offers both join routes to new users", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("link", { name: /Startup'ımla katıl/ }),
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("link", { name: /Mentor olmak istiyorum/ }),
    ).toHaveAttribute("href", "/signup?role=mentor");
  });

  it("lists mentee and mentor demo accounts together", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: /Ayşe Kaya/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Leyla Aksoy/ }),
    ).toBeInTheDocument();
    expect(useDemoAccounts).toHaveBeenCalledWith(UserRole.Mentee);
    expect(useDemoAccounts).toHaveBeenCalledWith(UserRole.Mentor);
  });

  it("fills the email field from a demo account button", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /Leyla Aksoy/ }));

    expect(screen.getByLabelText(/E-posta/)).toHaveValue(
      "leyla.aksoy@teknokent.demo",
    );
  });

  it("signs in with the chosen account and continues to the workspace", async () => {
    login.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /Ayşe Kaya/ }));
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("ayse.kaya@novamed.demo"),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
  });

  it("surfaces a failed sign-in without navigating away", async () => {
    login.mockRejectedValue(new Error("Hesap bulunamadı."));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/E-posta/), "yok@ornek.com");
    await user.click(screen.getByRole("button", { name: "Giriş yap" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Hesap bulunamadı.",
    );
    expect(push).not.toHaveBeenCalled();
  });
});
