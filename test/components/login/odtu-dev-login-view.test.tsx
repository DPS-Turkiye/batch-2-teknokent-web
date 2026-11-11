import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OdtuDevLoginView } from "@/components/login/odtu-dev-login-view";
import { IdentityKind } from "@/interfaces/session";
import {
  completeInstitutionLogin,
  fetchDevPersonas,
  startInstitutionLogin,
} from "@/lib/client/institution-login";
import { signInWithInstitutionToken } from "@/lib/firebase/auth";
import { renderWithQueryClient } from "@test/test-utils";

const push = vi.fn();
const replace = vi.fn();
const login = vi.fn();
let searchParams = new URLSearchParams("state=s-1");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ login }),
}));
vi.mock("@/lib/client/institution-login", () => ({
  completeInstitutionLogin: vi.fn(),
  fetchDevPersonas: vi.fn(),
  startInstitutionLogin: vi.fn(),
}));
vi.mock("@/lib/firebase/auth", () => ({
  signInWithInstitutionToken: vi.fn(),
  describeAuthError: (error: unknown) =>
    error instanceof Error ? error.message : "Kimlik doğrulama tamamlanamadı.",
}));

describe("ODTÜ dev login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams("state=s-1");
    vi.mocked(fetchDevPersonas).mockResolvedValue([
      {
        id: "dev-ogrenci-1",
        label: "Genel öğrenci",
        fullName: "Ayşe Yılmaz",
        kinds: [IdentityKind.Student],
      },
      {
        id: "dev-arasgor-1",
        label: "Araştırma görevlisi",
        fullName: "Elif Şahin",
        kinds: [IdentityKind.Student, IdentityKind.Academic],
      },
    ]);
    vi.mocked(completeInstitutionLogin).mockResolvedValue({
      customToken: "custom-1",
    });
    vi.mocked(signInWithInstitutionToken).mockResolvedValue("id-token-1");
    login.mockResolvedValue({});
  });

  it("signs in as the chosen persona through the real session path", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<OdtuDevLoginView />);

    expect(
      await screen.findByText("Öğrenci, Akademisyen", { exact: false }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Ayşe Yılmaz/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/workspace"));
    expect(completeInstitutionLogin).toHaveBeenCalledWith("odtu", "s-1", {
      persona: "dev-ogrenci-1",
    });
    expect(signInWithInstitutionToken).toHaveBeenCalledWith("custom-1");
    expect(login).toHaveBeenCalledWith("id-token-1");
  });

  it("shows the backend's refusal and stays on the page", async () => {
    vi.mocked(completeInstitutionLogin).mockRejectedValue(
      new Error("Bu hesap için menton erişimi bulunamadı."),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<OdtuDevLoginView />);

    await user.click(await screen.findByRole("button", { name: /Elif Şahin/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu hesap için menton erişimi bulunamadı.",
    );
    expect(login).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("starts a fresh login when opened without the backend's state", async () => {
    searchParams = new URLSearchParams();
    vi.mocked(startInstitutionLogin).mockResolvedValue({
      redirectUrl: "/login/odtu/dev?state=s-2",
      state: "s-2",
    });
    renderWithQueryClient(<OdtuDevLoginView />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login/odtu/dev?state=s-2"),
    );
    expect(
      await screen.findByRole("button", { name: /Ayşe Yılmaz/ }),
    ).toBeDisabled();
  });
});
